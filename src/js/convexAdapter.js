(() => {
  const OPEN = 1;
  const listeners = new Set();
  const onceListeners = new WeakSet();
  const queuedEvents = [];

  /** @type {import("convex/browser")["ConvexClient"]} */
  const ConvexClient = convex.ConvexClient;
  const api = convex.anyApi;
  const client = new ConvexClient(CONFIG.CONVEX_URL);
  let lastUpdateStamp = null;

  let currentOnMessage = null;

  function deliver(event) {
    if (!currentOnMessage && listeners.size === 0) {
      queuedEvents.push(event);
      return;
    }

    if (typeof currentOnMessage === "function") {
      currentOnMessage(event);
    }

    for (const listener of [...listeners]) {
      listener(event);
      if (onceListeners.has(listener)) {
        listeners.delete(listener);
        onceListeners.delete(listener);
      }
    }
  }

  function flushQueuedEvents() {
    while (queuedEvents.length > 0 && (currentOnMessage || listeners.size > 0)) {
      deliver(queuedEvents.shift());
    }
  }

  function dispatch(payload) {
    setTimeout(() => {
      deliver({ data: JSON.stringify(payload) });
    }, 0);
  }

  async function runQuery(functionName, args = {}) {
    return await client.query(functionName, args);
  }

  async function runMutation(functionName, args = {}) {
    return await client.mutation(functionName, args);
  }

  async function handleRequest(raw) {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    try {
      switch (data.type) {
        case "search":
          dispatch(await runQuery(api.stations.getTrail, { sender: data.sender }));
          break;
        case "fetch_information":
          dispatch(await runQuery(api.information.list, {}));
          break;
        case "safe_report":
          dispatch(await runQuery(api.reports.safeReport, {}));
          break;
        case "sender_report":
          dispatch(await runQuery(api.reports.senderReport, {}));
          break;
        case "fetch_sender_details":
          dispatch(
            await runQuery(api.history.senderDetails, {
              sender: data.sender,
              month: data.month
            })
          );
          break;
        case "fetch_history":
          dispatch(
            await runQuery(api.history.fetchHistory, {
              sender: data.sender,
              start_date: data.start_date || undefined,
              end_date: data.end_date || undefined
            })
          );
          break;
        case "mark_safe":
          await runMutation(api.stations.markSafe, { sender: data.sender });
          dispatch(await runQuery(api.stations.getLatest, {}));
          break;
        case "help_on_way":
          await runMutation(api.stations.markHelpOnWay, { sender: data.sender });
          dispatch(await runQuery(api.stations.getLatest, {}));
          break;
        case "not_found":
          await runMutation(api.stations.markNotFound, { sender: data.sender });
          dispatch(await runQuery(api.stations.getLatest, {}));
          break;
        default:
          dispatch({ type: "error", message: `Unsupported request type: ${data.type}` });
      }
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : "Convex request failed"
      });
    }
  }

  async function dispatchLatest() {
    try {
      dispatch(await runQuery(api.stations.getLatest, {}));
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load stations"
      });
    }
  }

  async function checkForChanges() {
    try {
      const nextStamp = await runQuery(api.stations.getUpdateStamp, {});
      const changed =
        !lastUpdateStamp ||
        nextStamp.packetCount !== lastUpdateStamp.packetCount ||
        nextStamp.latestTimeReceived !== lastUpdateStamp.latestTimeReceived;

      if (changed) {
        lastUpdateStamp = nextStamp;
        await dispatchLatest();
      }
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to check station changes"
      });
    }
  }

  if (typeof client.watchQuery === "function") {
    const latestWatch = client.watchQuery(api.stations.getLatest, {});
    latestWatch.onUpdate(() => {
      const payload = latestWatch.localQueryResult();
      if (payload !== undefined) {
        dispatch(payload);
      }
    });
  }

  void checkForChanges();
  setInterval(() => {
    void checkForChanges();
  }, 5000);

  const socketLike = {
    OPEN,
    readyState: OPEN,
    send(raw) {
      void handleRequest(raw);
    },
    addEventListener(type, listener, options = {}) {
      if (type !== "message" || typeof listener !== "function") {
        return;
      }
      listeners.add(listener);
      if (options.once) {
        onceListeners.add(listener);
      }
      flushQueuedEvents();
    },
    removeEventListener(type, listener) {
      if (type !== "message") {
        return;
      }
      listeners.delete(listener);
      onceListeners.delete(listener);
    }
  };

  Object.defineProperty(socketLike, "onmessage", {
    get() {
      return currentOnMessage;
    },
    set(value) {
      currentOnMessage = typeof value === "function" ? value : null;
      flushQueuedEvents();
    }
  });

  window.ws = socketLike;
})();
