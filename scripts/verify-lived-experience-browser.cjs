// External Playwright only; never bundled with the simulation.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { waitForVite } = require('./browser-startup.cjs');
const out = process.env.EVIDENCE_OUT || 'tracks/2026-10-24-lived-experience/evidence/browser';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5193',
    '--strictPort'
  ]);
  let browser;
  try {
    await waitForVite(server);
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.BROWSER_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/src/app/bootstrap.js', async (route) => {
      const response = await route.fetch();
      const body = await response.text(),
        at = body.lastIndexOf('}');
      await route.fulfill({
        response,
        body:
          body.slice(0, at) +
          'window.__testApp={sim,camera,renderer,inspector,loop,rebuildWorld};\n' +
          body.slice(at)
      });
    });
    await page.goto('http://127.0.0.1:5193/Genetics/');
    await page.waitForFunction(() => window.__testApp);
    await page.evaluate(() => {
      const a = window.__testApp;
      for (let i = 0; i < 120; i++) a.sim.tick();
      const c =
        a.sim.state.creatures.find((c) => c.lifeStory.flights > 0) ?? a.sim.state.creatures[0];
      a.inspector.selectCreature(c);
      a.inspector.update({ ...a.sim.state, config: a.sim.config });
      a.renderer.render(a.sim, { immediate: true });
    });
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/mobile.png` });
    // Hold real input across running animation frames. A synchronous DOM click
    // cannot detect a pressed button being replaced before pointer release.
    const timedInteractions = [];
    for (const mobile of [false, true]) {
      await page.setViewportSize(
        mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }
      );
      for (const deceased of [false, true]) {
        const fixture = await page.evaluate((deceased) => {
          const a = window.__testApp;
          a.loop.pause();
          const parent = a.sim.state.creatures[0];
          const child = a.sim.state.creatures[1];
          child.lineage.parents = [parent.id];
          parent.lifeStory.events = Array.from({ length: 12 }, (_, i) => ({
            seconds: i,
            text: `Milestone ${i}: a long journey through unfamiliar territory and past remembered danger.`
          }));
          a.inspector.selectCreature(parent);
          if (deceased) {
            parent.meters.hp = 0;
            a.sim.tick();
          }
          a.inspector.update({ ...a.sim.state, config: a.sim.config });
          window.__storyNodes = {
            button: document.querySelector('.life-story-family button'),
            list: document.querySelector('.life-story-events')
          };
          a.loop.start();
          return { childId: child.id, tick: a.sim.state.tick };
        }, deceased);
        const events = page.locator('.life-story-events');
        await events.scrollIntoViewIfNeeded();
        await events.hover();
        await page.mouse.wheel(0, 90);
        await page.waitForFunction(() => window.__storyNodes.list.scrollTop > 0);
        const scroll = await events.evaluate((el) => el.scrollTop);
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              let frames = 0;
              const next = () => (++frames === 6 ? resolve() : requestAnimationFrame(next));
              requestAnimationFrame(next);
            })
        );
        assert.equal(await events.evaluate((el) => el.scrollTop), scroll);
        assert(
          await page.evaluate(
            () => document.querySelector('.life-story-events') === window.__storyNodes.list
          )
        );
        const button = page.locator('.life-story-family button').first();
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        const x = box.x + box.width / 2,
          y = box.y + box.height / 2;
        let touch;
        if (mobile) {
          touch = await page.context().newCDPSession(page);
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y }]
          });
        } else {
          await page.mouse.move(x, y);
          await page.mouse.down();
        }
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              let frames = 0;
              const next = () => (++frames === 6 ? resolve() : requestAnimationFrame(next));
              requestAnimationFrame(next);
            })
        );
        assert(await page.evaluate(() => window.__storyNodes.button.isConnected));
        if (mobile) {
          await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await touch.detach();
        } else await page.mouse.up();
        await page.waitForFunction(
          (id) => window.__testApp.inspector.getTrackedId() === id,
          fixture.childId
        );
        assert(
          await page.evaluate(
            (id) => window.__testApp.camera.isFollowingCreature(id),
            fixture.childId
          )
        );
        assert(await page.evaluate((tick) => window.__testApp.sim.state.tick > tick, fixture.tick));
        await page.evaluate(() => window.__testApp.loop.pause());
        timedInteractions.push({ mobile, deceased, scrollRetained: true, heldInputFollow: true });
      }
    }
    const result = await page.evaluate(() => {
      const a = window.__testApp;
      if (
        [...document.querySelectorAll('.life-story-card [hidden]')].some(
          (el) => el.getClientRects().length
        )
      )
        throw Error('Hidden story fields are visible');
      const before = JSON.stringify(a.sim.state.creatures);
      for (let i = 0; i < 5; i++) a.inspector.update({ ...a.sim.state, config: a.sim.config });
      if (JSON.stringify(a.sim.state.creatures) !== before) throw Error('Inspector mutated actors');
      const parent = a.sim.state.creatures.find((c) => c.id === a.inspector.getTrackedId());
      const child = a.sim.state.creatures.find((c) => c.id !== parent.id);
      // Explicit UI lifecycle fixture: death uses the production death pipeline.
      child.lineage.parents = [parent.id];
      parent.meters.hp = 0;
      a.sim.tick();
      a.inspector.update({ ...a.sim.state, config: a.sim.config });
      if (!document.querySelector('.life-story-card').textContent.includes('Life ended · injury'))
        throw Error('Missing exact memorial');
      const target = [...document.querySelectorAll('.life-story-family button')].find((b) =>
        b.textContent.startsWith('Child:')
      );
      if (!target) throw Error('Missing child continuation');
      const size = target.getBoundingClientRect();
      if (size.height < 44) throw Error('Small tap target');
      target.click();
      if (a.inspector.getTrackedId() !== child.id || !a.camera.isFollowingCreature(child.id))
        throw Error('Family follow failed');
      const card = document.querySelector('.life-story-card').getBoundingClientRect();
      if (card.left < 0 || card.right > innerWidth) throw Error('Mobile overflow');
      a.rebuildWorld(42);
      if (a.inspector.getTrackedId() !== null || a.sim.state.world.memorials.length)
        throw Error('Reset leaked history');
      return {
        passiveInspector: true,
        exactDeath: true,
        followChild: true,
        tapHeight: size.height,
        mobileOverflow: false,
        reset: true
      };
    });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${out}/results.json`,
      JSON.stringify(
        { browser: await browser.version(), ...result, timedInteractions, pageErrors: errors },
        null,
        2
      ) + '\n'
    );
    console.log(result);
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
