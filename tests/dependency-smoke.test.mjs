import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Play } from "lucide-react";

test("TanStack Query stores and retrieves cached data", () => {
  const client = new QueryClient();
  const video = { id: "video-123", title: "Sample video" };

  client.setQueryData(["video", video.id], video);

  assert.deepEqual(client.getQueryData(["video", video.id]), video);
});

test("Lucide icons render through React server rendering", () => {
  const markup = renderToStaticMarkup(
    createElement(Play, { "aria-label": "Play video" }),
  );

  assert.match(markup, /<svg/);
  assert.match(markup, /aria-label="Play video"/);
});
