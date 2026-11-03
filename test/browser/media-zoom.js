// Run through playwright-cli's run-code command; see docs/media-zoom.md.
async page => {
  function check(value, message) { if (!value) throw new Error(message); }
  await page.keyboard.press('Escape');
  const viewport = page.locator('.mdopen-media-viewport');
  const content = page.locator('.mdopen-media-content');
  const dialog = page.locator('dialog.mdopen-media-overlay');
  const buttons = page.locator('.mdopen-media-fullscreen-btn:not(:disabled)');
  await buttons.first().waitFor();
  const count = await buttons.count();
  check(count > 0, 'media must have a Full button');
  const originalImages = await page.locator('.markdown-body img').count();
  await buttons.first().click();
  check(await dialog.evaluate(d => d.open), 'Full must open a modal dialog');
  await page.locator('.mdopen-media-content img').evaluate(img => img.decode());
  const initial = await content.boundingBox();
  const box = await viewport.boundingBox();
  check(initial.width <= box.width && initial.height <= box.height, 'media must initially fit');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -100);
  await page.waitForFunction(width => document.querySelector('.mdopen-media-content').getBoundingClientRect().width > width, initial.width);
  await page.getByRole('button', {name:'Zoom in', exact:true}).click();
  const zoomed = await content.boundingBox();
  check(zoomed.width > initial.width, 'wheel and button must zoom');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y + 45);
  await page.mouse.up();
  const moved = await content.boundingBox();
  check(Math.abs(moved.x - zoomed.x - 80) < 2 && Math.abs(moved.y - zoomed.y - 45) < 2, 'drag must follow screen pixels');
  await page.getByRole('button', {name:'Fit', exact:true}).click();
  const fitted = await content.boundingBox();
  check(Math.abs(fitted.width - initial.width) < 1, 'Fit must restore the initial scale');
  await page.keyboard.press('+');
  check((await content.boundingBox()).width > fitted.width, 'keyboard + must zoom');
  await page.keyboard.press('0');
  check(Math.abs((await content.boundingBox()).width - initial.width) < 1, 'keyboard 0 must fit');
  // Dispatch a two-pointer gesture to exercise pinch without depending on a device.
  await viewport.evaluate(el => {
    const r = el.getBoundingClientRect();
    const fire = (type, id, x) => el.dispatchEvent(new PointerEvent(type, {pointerId:id, pointerType:'touch', button:0, clientX:r.x+x, clientY:r.y+100, bubbles:true}));
    // Synthetic pointers cannot be captured, so suppress capture in this probe.
    const capture = el.setPointerCapture;
    el.setPointerCapture = () => {};
    try {
      fire('pointerdown', 11, 100); fire('pointerdown', 12, 200);
      fire('pointermove', 12, 300);
      fire('pointerup', 11, 100); fire('pointerup', 12, 300);
    } finally { el.setPointerCapture = capture; }
  });
  check((await content.boundingBox()).width > initial.width * 1.5, 'pinch must zoom');
  const pinched = await content.boundingBox();
  await page.getByRole('button', {name:'Zoom out', exact:true}).click();
  check((await content.boundingBox()).width < pinched.width, 'minus button must zoom out');
  await viewport.dblclick({position:{x:box.width / 2, y:box.height / 2}});
  check(Math.abs((await content.boundingBox()).width - initial.width) < 1, 'double-click must fit');
  await page.keyboard.press('Escape');
  check(!await dialog.evaluate(d => d.open), 'Escape must close');
  check(await buttons.first().evaluate(b => b === document.activeElement), 'focus must return to Full');
  check(await page.locator('body').evaluate(b => b.style.overflow !== 'hidden'), 'scroll lock must be released');
  check(await page.locator('.markdown-body img').count() === originalImages, 'original images must remain in place');
  await buttons.first().click();
  await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
  check(!await dialog.evaluate(d => d.open), 'printing must close zoom');
  await page.emulateMedia({media:'print'});
  check(await buttons.first().evaluate(b => getComputedStyle(b).display === 'none'), 'Full controls must not print');
  await page.emulateMedia({media:'screen'});
  await buttons.first().click();
  await page.evaluate(() => document.dispatchEvent(new Event('mdopen-theme-change')));
  check(!await dialog.evaluate(d => d.open), 'theme changes must close stale zoom');
  const originalViewport = page.viewportSize();
  await page.setViewportSize({width:320, height:640});
  await buttons.first().click();
  const controls = await page.locator('.mdopen-media-controls').boundingBox();
  const smallViewport = await viewport.boundingBox();
  check(controls.y + controls.height <= smallViewport.y, 'controls must fit above media on narrow screens');
  await page.keyboard.press('Escape');
  await page.setViewportSize(originalViewport);
  // Live editor/directory replacement must release the modal and lock too.
  await buttons.first().click();
  await page.evaluate(() => { document.querySelector('.markdown-body').innerHTML = '<p>Replaced</p>'; });
  await page.waitForFunction(() => !document.querySelector('dialog.mdopen-media-overlay').open);
  check(await page.locator('body').evaluate(b => b.style.overflow !== 'hidden'), 'replacement must release scroll lock');
  return {passed:true, media:count, originalImages};
}
