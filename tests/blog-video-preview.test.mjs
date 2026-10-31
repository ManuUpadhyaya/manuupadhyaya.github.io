import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class Element extends EventTarget {
  attributes = new Map();
  hidden = true;

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
  click() {
    this.dispatchEvent(new Event("click", { cancelable: true }));
  }
}

function loadPreview({
  reducedMotion = false,
  observer = true,
  fullscreen = "standard",
  rejectPlay = false,
  deferPlay = false,
  deferPause = false,
} = {}) {
  const document = new EventTarget();
  document.hidden = false;
  document.fullscreenElement = null;
  const preview = new Element();
  const toggle = new Element();
  toggle.setAttribute("aria-label", "Pause animation preview for Gradient descent");
  const fullscreenControl = new Element();
  const video = new Element();
  video.paused = true;
  video.ended = false;
  video.playCalls = 0;
  const pauseEvents = [];
  video.pause = () => {
    if (video.paused) return;
    video.paused = true;
    const dispatch = () => video.dispatchEvent(new Event("pause"));
    if (deferPause) pauseEvents.push(dispatch);
    else dispatch();
  };
  let finishPlay;
  const startPlaying = () => {
    video.paused = false;
    video.dispatchEvent(new Event("play"));
    video.dispatchEvent(new Event("playing"));
  };
  video.play = () => {
    video.playCalls++;
    if (rejectPlay) return Promise.reject(new Error("Autoplay blocked"));
    if (deferPlay) {
      return new Promise((resolve) => {
        finishPlay = () => {
          startPlaying();
          resolve();
        };
      });
    }
    startPlaying();
    return Promise.resolve();
  };
  preview.querySelector = (selector) => ({ video, "[data-video-toggle]": toggle, "[data-video-fullscreen]": fullscreenControl })[selector] ?? null;
  document.querySelectorAll = (selector) => (selector === "[data-video-preview]" ? [preview] : []);
  if (fullscreen === "standard") {
    document.fullscreenEnabled = true;
    preview.requestFullscreen = async () => {
      document.fullscreenElement = preview;
      document.dispatchEvent(new Event("fullscreenchange"));
    };
    document.exitFullscreen = async () => {
      document.fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    };
  } else if (fullscreen === "ios") {
    video.webkitEnterFullscreen = () => {
      video.webkitDisplayingFullscreen = true;
      video.dispatchEvent(new Event("webkitbeginfullscreen"));
    };
    video.webkitExitFullscreen = () => {
      video.webkitDisplayingFullscreen = false;
      video.dispatchEvent(new Event("webkitendfullscreen"));
    };
  }
  const mediaQuery = new EventTarget();
  mediaQuery.matches = reducedMotion;
  let intersectionCallback;
  const context = vm.createContext({
    document,
    matchMedia: () => mediaQuery,
    ...(observer && {
      IntersectionObserver: class {
        constructor(callback) {
          intersectionCallback = callback;
        }
        observe(element) {
          assert.equal(element, preview);
        }
      },
    }),
  });
  context.window = context;
  const source = new URL("../assets/js/blog-video-preview.js", import.meta.url);
  vm.runInContext(existsSync(source) ? readFileSync(source, "utf8") : "", context);
  return {
    video,
    toggle,
    preview,
    document,
    fullscreenControl,
    nativePlay: startPlaying,
    flushPauseEvents: () => pauseEvents.splice(0).forEach((dispatch) => dispatch()),
    finishPlay: () => finishPlay(),
    allowPlay: () => (rejectPlay = false),
    setVisible(visible) {
      intersectionCallback?.([{ target: preview, isIntersecting: visible }]);
    },
    setHidden(hidden) {
      document.hidden = hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("each preview video links to its post while playback and fullscreen controls remain independent", () => {
  const result = spawnSync(
    "bundle",
    [
      "exec",
      "ruby",
      "-rjekyll",
      "-rnokogiri",
      "-rjson",
      "-e",
      String.raw`
        require_relative '_plugins/cache-bust'
        template = Liquid::Template.parse(File.read('_includes/blog-video-preview.liquid'))
        fixtures = [
          ['', '/blog/gradient-descent/', 'Gradient descent'],
          ['/project', '/blog/lyapunov-analysis/', 'Lyapunov & convergence']
        ]
        results = fixtures.map do |baseurl, url, title|
          site = Jekyll::Site.new(Jekyll.configuration('source' => Dir.pwd, 'baseurl' => baseurl, 'quiet' => true))
          html = template.render!(
            { 'post' => { 'url' => url }, 'include' => { 'title' => title, 'preview' => {
              'poster' => '/assets/video/lyapunov-poster.webp', 'video' => '/assets/video/lyapunov.mp4'
            } } }, registers: { site: site }, strict_filters: true
          )
          preview = Nokogiri::HTML5.fragment(html)
          link = preview.at_css('video').ancestors('a').first
          {
            href: link&.[]('href'), label: link&.[]('aria-label'),
            controls: preview.css('[data-video-toggle], [data-video-fullscreen]').map { |control|
              { type: control['type'], links: control.ancestors('a').length }
            }
          }
        end
        puts JSON.generate(results)
      `,
    ],
    { cwd: new URL("../", import.meta.url), encoding: "utf8" }
  );
  assert.equal(result.status, 0, result.stderr);
  const previews = JSON.parse(result.stdout);
  assert.deepEqual(
    previews.map(({ href }) => href),
    ["/blog/gradient-descent/", "/project/blog/lyapunov-analysis/"]
  );
  assert.match(previews[0].label, /Gradient descent/);
  assert.match(previews[1].label, /Lyapunov & convergence/);
  for (const preview of previews) {
    assert.deepEqual(preview.controls, [
      { type: "button", links: 0 },
      { type: "button", links: 0 },
    ]);
  }
});

test("visible previews play silently inline and a click pauses or resumes them", async () => {
  const { video, toggle, setVisible } = loadPreview();
  assert.equal(video.paused, true);
  setVisible(true);
  await settle();
  assert.equal(video.paused, false);
  assert.equal(video.muted, true);
  assert.equal(video.loop, true);
  assert.equal(video.playsInline, true);
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
  assert.equal(toggle.getAttribute("aria-label"), "Pause animation preview for Gradient descent");
  toggle.click();
  assert.equal(video.paused, true);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.equal(toggle.getAttribute("aria-label"), "Play animation preview for Gradient descent");
  toggle.click();
  await settle();
  assert.equal(video.paused, false);
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
});

test("automatic visibility pauses resume but a user pause survives leaving and returning", async () => {
  const { video, toggle, setVisible, setHidden } = loadPreview();
  setVisible(true);
  await settle();
  setVisible(false);
  assert.equal(video.paused, true);
  setVisible(true);
  await settle();
  assert.equal(video.paused, false);
  setHidden(true);
  assert.equal(video.paused, true);
  setHidden(false);
  await settle();
  assert.equal(video.paused, false);
  toggle.click();
  setVisible(false);
  setHidden(true);
  setVisible(true);
  setHidden(false);
  await settle();
  assert.equal(video.paused, true);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
});

test("reduced motion leaves the poster still until the user explicitly starts playback", async () => {
  const { video, toggle, setVisible, setHidden } = loadPreview({ reducedMotion: true });
  setVisible(true);
  await settle();
  assert.equal(video.playCalls, 0);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  toggle.click();
  await settle();
  assert.equal(video.paused, false);
  setHidden(true);
  setHidden(false);
  await settle();
  assert.equal(video.paused, false);
});

test("blocked autoplay stays accessible as paused and a user click can retry", async () => {
  const { video, toggle, allowPlay, setVisible } = loadPreview({ rejectPlay: true });
  setVisible(true);
  await settle();
  assert.equal(video.playCalls, 1);
  assert.equal(video.paused, true);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.equal(toggle.getAttribute("aria-label"), "Play animation preview for Gradient descent");
  allowPlay();
  toggle.click();
  await settle();
  assert.equal(video.paused, false);
});

test("a delayed play result cannot restart a preview after the user pauses it", async () => {
  const { video, toggle, setVisible, finishPlay } = loadPreview({ deferPlay: true });
  setVisible(true);
  assert.equal(video.playCalls, 1);
  toggle.click();
  finishPlay();
  await settle();
  assert.equal(video.paused, true);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  setVisible(false);
  setVisible(true);
  assert.equal(video.playCalls, 1);
});

test("standard fullscreen enters and exits without toggling playback", async () => {
  const { video, preview, document, fullscreenControl, setVisible } = loadPreview();
  setVisible(true);
  await settle();
  assert.equal(fullscreenControl.hidden, false);
  fullscreenControl.click();
  await settle();
  assert.equal(document.fullscreenElement, preview);
  assert.equal(fullscreenControl.getAttribute("aria-label"), "Exit fullscreen");
  assert.equal(fullscreenControl.getAttribute("title"), "Exit fullscreen");
  assert.equal(video.paused, false);
  fullscreenControl.click();
  await settle();
  assert.equal(document.fullscreenElement, null);
  assert.equal(fullscreenControl.getAttribute("aria-label"), "Enter fullscreen");
  assert.equal(video.paused, false);
});

test("iOS native fullscreen is available without changing a user pause", async () => {
  const { video, toggle, fullscreenControl, setVisible } = loadPreview({ fullscreen: "ios" });
  setVisible(true);
  await settle();
  toggle.click();
  fullscreenControl.click();
  assert.equal(fullscreenControl.hidden, false);
  assert.equal(video.webkitDisplayingFullscreen, true);
  assert.equal(fullscreenControl.getAttribute("aria-label"), "Exit fullscreen");
  assert.equal(video.paused, true);
  fullscreenControl.click();
  assert.equal(video.webkitDisplayingFullscreen, false);
  assert.equal(fullscreenControl.getAttribute("aria-label"), "Enter fullscreen");
});

test("unsupported fullscreen stays hidden and browsers without visibility observation can play", async () => {
  const { video, fullscreenControl } = loadPreview({ observer: false, fullscreen: false });
  await settle();
  assert.equal(video.paused, false);
  assert.equal(fullscreenControl.hidden, true);
});

test("the iOS native play control can start a user-paused preview even when its inline viewport is obscured", async () => {
  const { video, toggle, fullscreenControl, setVisible, nativePlay } = loadPreview({ fullscreen: "ios" });
  setVisible(true);
  await settle();
  toggle.click();
  fullscreenControl.click();
  setVisible(false);
  nativePlay();
  assert.equal(video.paused, false);
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
});

test("reduced motion still permits an explicit play from the iOS native player", async () => {
  const { video, toggle, fullscreenControl, setVisible, nativePlay } = loadPreview({ fullscreen: "ios", reducedMotion: true });
  setVisible(true);
  fullscreenControl.click();
  assert.equal(video.paused, true);
  nativePlay();
  assert.equal(video.paused, false);
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
  fullscreenControl.click();
  setVisible(false);
  setVisible(true);
  await settle();
  assert.equal(video.paused, false);
});

test("a native-player pause persists after leaving iOS fullscreen and revisiting the preview", async () => {
  const { video, toggle, fullscreenControl, setVisible, setHidden } = loadPreview({ fullscreen: "ios" });
  setVisible(true);
  await settle();
  fullscreenControl.click();
  video.pause();
  fullscreenControl.click();
  setVisible(false);
  setHidden(true);
  setVisible(true);
  setHidden(false);
  await settle();
  assert.equal(video.paused, true);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
});

test("automatic document hiding in iOS fullscreen preserves playback intent", async () => {
  const { video, fullscreenControl, setVisible, setHidden } = loadPreview({ fullscreen: "ios" });
  setVisible(true);
  await settle();
  fullscreenControl.click();
  setVisible(false);
  assert.equal(video.paused, false);
  setHidden(true);
  assert.equal(video.paused, true);
  setHidden(false);
  await settle();
  assert.equal(video.paused, false);
});

test("a queued automatic pause event does not become a native user pause after the document returns", async () => {
  const { video, fullscreenControl, setVisible, setHidden, flushPauseEvents } = loadPreview({ fullscreen: "ios", deferPause: true });
  setVisible(true);
  await settle();
  fullscreenControl.click();
  setHidden(true);
  setHidden(false);
  await settle();
  flushPauseEvents();
  fullscreenControl.click();
  setVisible(false);
  setVisible(true);
  await settle();
  assert.equal(video.paused, false);
});
