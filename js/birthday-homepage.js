(() => {
  const lifecycle = window.PrinceBirthdayLifecycle;
  if (!lifecycle) return;

  const promo = document.getElementById('birthday-home-promo');
  if (!promo) return;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const hidePromo = () => {
    promo.hidden = true;
  };

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const context = await lifecycle.getContext();
      const enabled = context?.config?.event?.homepagePromoEnabledDuringEvent !== false;

      if (!(context.isLive && enabled)) {
        hidePromo();
        return;
      }

      setText('birthday-home-status', context.statusText);

      const countdown = document.getElementById('birthday-home-countdown');
      if (countdown && Number.isFinite(context.countdownTargetMs)) {
        const tick = () => {
          const remaining = context.countdownTargetMs - Date.now();
          countdown.textContent = lifecycle.formatCountdown(remaining);
        };
        tick();
        window.setInterval(tick, 1000);
      }

      promo.hidden = false;
    } catch {
      hidePromo();
    }
  });
})();
