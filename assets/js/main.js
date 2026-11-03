/*
 * ANYWARE studio site
 *
 * itch.io is used for payments only. This script:
 *   1. loads itch.io's official API (https://static.itch.io/api.js),
 *   2. turns every [data-itch-buy="<game>"] link into an itch.io
 *      checkout popup, and
 *   3. renders itch.io's official store widget into every
 *      [data-itch-embed="<game>"] element.
 *
 * Without JavaScript, or if itch.io can't be reached, the buy links still
 * go straight to the game's itch.io page, so purchasing always works.
 *
 * To skip the widget's ID lookup, put the numeric itch.io game ID on the
 * element: <div data-itch-embed="mobius" data-itch-id="1234567">.
 */
(function () {
  "use strict";

  var ITCH_USER = "anyware-studios";
  var ITCH_API = "https://static.itch.io/api.js";
  var EMBED_TIMEOUT_MS = 8000;

  // Widget colours match the site palette (hex without '#').
  var WIDGET_COLORS = {
    bg_color: "1a1a20",
    fg_color: "f4f1ea",
    link_color: "fe7005",
    border_color: "2a2a33"
  };

  var buyLinks = Array.prototype.slice.call(document.querySelectorAll("[data-itch-buy]"));
  var embeds = Array.prototype.slice.call(document.querySelectorAll("[data-itch-embed]"));
  if (!buyLinks.length && !embeds.length) return;

  function itchPageUrl(game) {
    return "https://" + ITCH_USER + ".itch.io/" + encodeURIComponent(game);
  }

  function widgetUrl(id) {
    var params = ["dark=true", "linkback=true"];
    for (var key in WIDGET_COLORS) params.push(key + "=" + WIDGET_COLORS[key]);
    return "https://itch.io/embed/" + encodeURIComponent(id) + "?" + params.join("&");
  }

  function renderWidget(el, id, title) {
    var frame = document.createElement("iframe");
    frame.src = widgetUrl(id);
    frame.title = (title || "Game") + " on itch.io";
    frame.loading = "lazy";
    frame.setAttribute("frameborder", "0");
    el.innerHTML = "";
    el.appendChild(frame);
  }

  function hideWidget(el) {
    el.hidden = true;
  }

  // Embeds that already know their ID can render without the API.
  var pendingEmbeds = embeds.filter(function (el) {
    var id = el.getAttribute("data-itch-id");
    if (id) {
      renderWidget(el, id, el.getAttribute("data-itch-embed"));
      return false;
    }
    return true;
  });

  var embedTimer = setTimeout(function () {
    pendingEmbeds.forEach(function (el) {
      if (!el.querySelector("iframe")) hideWidget(el);
    });
  }, EMBED_TIMEOUT_MS);

  function onApiReady() {
    var Itch = window.Itch;
    if (!Itch) return onApiFailed();

    // Buy buttons → itch.io checkout popup.
    if (typeof Itch.attachBuyButton === "function") {
      buyLinks.forEach(function (link) {
        var game = link.getAttribute("data-itch-buy");
        try {
          Itch.attachBuyButton(link, { user: ITCH_USER, game: game });
          // itch.io opens its own checkout window; keep the page from also
          // following the fallback link.
          link.addEventListener("click", function (e) { e.preventDefault(); });
        } catch (err) {
          link.href = itchPageUrl(game);
        }
      });
    }

    // Store widget: look up the numeric game ID, then embed it.
    if (typeof Itch.getGameData !== "function") {
      pendingEmbeds.forEach(hideWidget);
      return;
    }
    pendingEmbeds.forEach(function (el) {
      var game = el.getAttribute("data-itch-embed");
      Itch.getGameData({
        user: ITCH_USER,
        game: game,
        onComplete: function (data) {
          if (data && data.id && !data.errors) {
            renderWidget(el, data.id, data.title);
          } else {
            hideWidget(el);
          }
        }
      });
    });
  }

  function onApiFailed() {
    clearTimeout(embedTimer);
    pendingEmbeds.forEach(hideWidget);
    // Buy links already point at the itch.io page, so nothing else to do.
  }

  var script = document.createElement("script");
  script.src = ITCH_API;
  script.async = true;
  script.onload = onApiReady;
  script.onerror = onApiFailed;
  document.head.appendChild(script);
})();
