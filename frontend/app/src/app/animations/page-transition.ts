import { createAnimation, AnimationBuilder } from '@ionic/angular/standalone';

export const pageTransitionAnimation: AnimationBuilder = (baseEl, opts) => {
  const enteringEl: HTMLElement = opts.enteringEl;
  const leavingEl: HTMLElement = opts.leavingEl;
  const isForward = opts.direction !== 'back';

  const enterSlide = isForward ? '28px' : '-28px';
  const leaveSlide = isForward ? '-28px' : '28px';

  const enterAnim = createAnimation()
    .addElement(enteringEl)
    .duration(260)
    .easing('cubic-bezier(0.36, 0.66, 0.04, 1)')
    .fromTo('opacity', '0', '1')
    .fromTo('transform', `translateX(${enterSlide})`, 'translateX(0)');

  const leaveAnim = createAnimation()
    .addElement(leavingEl)
    .duration(260)
    .easing('cubic-bezier(0.36, 0.66, 0.04, 1)')
    .fromTo('opacity', '1', '0')
    .fromTo('transform', 'translateX(0)', `translateX(${leaveSlide})`);

  return createAnimation().addAnimation([enterAnim, leaveAnim]);
};
