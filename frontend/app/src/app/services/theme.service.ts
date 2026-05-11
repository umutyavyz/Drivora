import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: 'light' | 'dark' | 'system' = 'system';

  constructor() {
    this.initTheme();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      this.currentTheme = 'system';
    }
    this.applyTheme(this.currentTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme === 'system') {
        this.toggleDarkClass(e.matches);
      }
    });
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  getTheme() {
    return this.currentTheme;
  }

  private applyTheme(theme: 'light' | 'dark' | 'system') {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.toggleDarkClass(isDark);
    } else {
      this.toggleDarkClass(theme === 'dark');
    }
  }

  private toggleDarkClass(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('ion-palette-dark');
    } else {
      document.documentElement.classList.remove('ion-palette-dark');
    }
  }
}
