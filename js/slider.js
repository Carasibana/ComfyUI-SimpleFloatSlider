import { app } from "../../scripts/app.js";

// ---------------------------------------------------------------------------
// Styles – injected once
// ---------------------------------------------------------------------------
const STYLE_ID = "float-slider-node-styles";
if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .fsn-wrap {
            width: 100%;
            padding: 0 10px 8px;
            margin-top: -8px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 7px;
        }

        /* ---- prominent value display ---- */
        .fsn-value {
            font-size: 28px;
            font-weight: 700;
            font-family: 'Courier New', Courier, monospace;
            letter-spacing: 2px;
            color: #e8eaf0;
            text-shadow: 0 0 12px rgba(90, 190, 255, 0.55);
            padding: 3px 16px;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.30);
            cursor: pointer;
            user-select: none;
            transition: background 0.15s, text-shadow 0.15s;
            min-width: 100px;
            text-align: center;
        }
        .fsn-value:hover {
            background: rgba(90, 190, 255, 0.12);
            text-shadow: 0 0 16px rgba(90, 190, 255, 0.8);
        }

        /* ---- inline edit input ---- */
        .fsn-edit {
            font-size: 24px;
            font-family: 'Courier New', Courier, monospace;
            width: 130px;
            text-align: center;
            background: rgba(0, 0, 0, 0.55);
            color: #e8eaf0;
            border: 1.5px solid rgba(90, 190, 255, 0.75);
            border-radius: 6px;
            padding: 2px 8px;
            outline: none;
        }

        /* ---- range slider track ---- */
        .fsn-slider {
            width: 100%;
            -webkit-appearance: none;
            appearance: none;
            height: 6px;
            border-radius: 3px;
            outline: none;
            cursor: pointer;
            background: transparent;
        }

        /* WebKit track — fill driven by --fsn-fill CSS variable set in JS */
        .fsn-slider::-webkit-slider-runnable-track {
            height: 6px;
            border-radius: 3px;
            background: linear-gradient(
                to right,
                #5ac8ff var(--fsn-fill, 50%),
                #303040 var(--fsn-fill, 50%)
            );
        }

        /* WebKit thumb */
        .fsn-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #5ac8ff;
            cursor: pointer;
            box-shadow: 0 0 7px rgba(90, 200, 255, 0.85);
            transition: transform 0.1s;
            margin-top: -6px;
        }
        .fsn-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }

        /* Firefox track + progress (browser fills progress natively) */
        .fsn-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #5ac8ff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 7px rgba(90, 200, 255, 0.85);
        }
        .fsn-slider::-moz-range-track {
            height: 6px;
            border-radius: 3px;
            background: #303040;
        }
        .fsn-slider::-moz-range-progress {
            height: 6px;
            border-radius: 3px 0 0 3px;
            background: #5ac8ff;
        }

        /* ---- range toggle button (int slider) ---- */
        .fsn-toggle {
            font-size: 10px;
            font-family: 'Courier New', Courier, monospace;
            background: transparent;
            color: rgba(90, 190, 255, 0.55);
            border: none;
            cursor: pointer;
            padding: 0;
            letter-spacing: 1px;
            transition: color 0.15s;
            margin-top: -2px;
        }
        .fsn-toggle:hover {
            color: #5ac8ff;
        }
    `;
    document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function precisionStep(p) {
    return p === 0 ? 1 : parseFloat(Math.pow(10, -p).toFixed(p));
}

// Int slider steps are whole numbers only, and never smaller than 1.
function intStep(s) {
    const n = Math.round(parseFloat(s));
    return isNaN(n) || n < 1 ? 1 : n;
}

// Snap `v` onto the grid of `step` measured from `base`. toFixed(10) strips the
// floating-point noise that base + k * step accumulates (0.30000000000000004).
function snapToGrid(v, base, step) {
    if (!(step > 0)) return v;
    return parseFloat((base + Math.round((v - base) / step) * step).toFixed(10));
}

function updateFill(slider, min, max, value) {
    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
    const c = Math.max(0, Math.min(100, pct));
    slider.style.setProperty('--fsn-fill', `${c}%`);
}

// ---------------------------------------------------------------------------
// Build the DOM widget element for FLOAT sliders
// ---------------------------------------------------------------------------
function buildSliderElement(initValue, initMin, initMax, initPrecision, initStep, includeToggle = false) {
    let value     = initValue;
    // Unclamped source of truth. `value` is always derived from this, so clamping
    // against temporarily-wrong bounds (e.g. during a workflow load, before the
    // config widgets have been read back) never destroys the real value.
    let rawValue  = initValue;
    let min       = initMin;
    let max       = initMax;
    let precision = initPrecision;
    let step      = initStep ?? precisionStep(initPrecision);

    const wrap = document.createElement("div");
    wrap.className = "fsn-wrap";

    // — value display —
    const display = document.createElement("div");
    display.className = "fsn-value";
    display.textContent = value.toFixed(precision);

    // — range input —
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "fsn-slider";

    // Drag snaps are measured from wherever the value already was when the drag
    // started. While the value sits on the min-grid that is the same grid a native
    // step= would give; once it has been typed off-grid, steps run from the typed
    // value instead. Changing `step` re-grids from min — see setStep below.
    let dragAnchor = null;

    function applyBounds() {
        slider.min   = min;
        slider.max   = max;
        slider.step  = "any";   // snapping is done below, not by the browser
        value = Math.max(min, Math.min(max, rawValue));
        slider.value = value;
        display.textContent = value.toFixed(precision);
        updateFill(slider, min, max, value);
    }
    applyBounds();

    // drag
    slider.addEventListener("input", () => {
        if (dragAnchor === null) dragAnchor = value;
        const snapped = snapToGrid(parseFloat(slider.value), dragAnchor, step);
        value = Math.max(min, Math.min(max, snapped));
        rawValue = value;
        slider.value = value;
        display.textContent = value.toFixed(precision);
        updateFill(slider, min, max, value);
    });
    // Drag finished — the next one re-anchors on the value we landed on.
    slider.addEventListener("change", () => { dragAnchor = null; });

    // scroll over display or slider → nudge value by one step
    function onWheelFloat(e) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? step : -step;
        value = parseFloat((Math.max(min, Math.min(max, value + delta))).toFixed(precision));
        rawValue = value;
        dragAnchor = null;
        slider.value = value;
        display.textContent = value.toFixed(precision);
        updateFill(slider, min, max, value);
    }
    display.addEventListener("wheel", onWheelFloat, { passive: false });
    slider.addEventListener("wheel", onWheelFloat, { passive: false });

    // click display → inline edit
    display.addEventListener("click", () => {
        const edit = document.createElement("input");
        edit.type = "number";
        edit.className = "fsn-edit";
        edit.value = value.toFixed(precision);
        edit.step  = step;
        display.replaceWith(edit);
        edit.focus();
        edit.select();

        function commit() {
            const parsed = parseFloat(edit.value);
            if (!isNaN(parsed)) {
                value = Math.max(min, Math.min(max, parsed));
                value = parseFloat(value.toFixed(precision));
                rawValue = value;
                dragAnchor = null;
            }
            slider.value = value;
            display.textContent = value.toFixed(precision);
            updateFill(slider, min, max, value);
            edit.replaceWith(display);
        }
        edit.addEventListener("blur", commit);
        edit.addEventListener("keydown", (e) => {
            if (e.key === "Enter")  { e.preventDefault(); commit(); }
            if (e.key === "Escape") { edit.replaceWith(display); }
        });
    });

    let toggleBtn = null;
    if (includeToggle) {
        toggleBtn = document.createElement("button");
        toggleBtn.className = "fsn-toggle";
        toggleBtn.textContent = "▾ configure";
    }

    wrap.appendChild(display);
    wrap.appendChild(slider);
    if (toggleBtn) wrap.appendChild(toggleBtn);

    return {
        element: wrap,
        toggleBtn,
        getValue:     ()  => value,
        setValue:     (v) => {
            const parsed = parseFloat(v);
            rawValue = isNaN(parsed) ? 0 : parsed;
            applyBounds();
        },
        // Restoring saved configuration. Never re-grids — a value saved off-grid was
        // typed deliberately and must survive the reload intact.
        updateBounds: (newMin, newMax, newPrecision, newStep) => {
            if (newMin       != null) min       = parseFloat(newMin);
            if (newMax       != null) max       = parseFloat(newMax);
            if (newPrecision != null) precision = parseInt(newPrecision);
            if (newStep      != null) step      = parseFloat(newStep);
            applyBounds();
        },
        // The user editing the `step` widget. Re-grids the current value onto the
        // nearest multiple of the new step from min, so changing step always lands you
        // back on-grid; typing a value afterwards is the only way off it again.
        setStep: (newStep) => {
            const parsed = parseFloat(newStep);
            if (!isNaN(parsed) && parsed > 0) step = parsed;
            rawValue   = snapToGrid(rawValue, min, step);
            dragAnchor = null;
            applyBounds();
        },
    };
}

// ---------------------------------------------------------------------------
// Build the DOM widget element for INT slider
// ---------------------------------------------------------------------------
function buildIntSliderElement(initValue, initMin, initMax, initStep) {
    let value    = Math.round(initValue);
    let rawValue = Math.round(initValue);   // see buildSliderElement
    let min      = Math.round(initMin);
    let max      = Math.round(initMax);
    // Always a whole number of at least 1, so the slider can never land off-integer.
    let step     = intStep(initStep);

    const wrap = document.createElement("div");
    wrap.className = "fsn-wrap";

    const display = document.createElement("div");
    display.className = "fsn-value";
    display.textContent = String(value);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "fsn-slider";

    // Anchor the drag snaps to wherever the value already was when the drag started,
    // so a typed value like 37 with step 5 moves to 42/32 rather than to the 35/40
    // grid a native step= would impose (the browser anchors its grid at min).
    let dragAnchor = null;

    function applyBounds() {
        slider.min   = min;
        slider.max   = max;
        slider.step  = "any";   // snapping is done below, not by the browser
        value = Math.max(min, Math.min(max, Math.round(rawValue)));
        slider.value = value;
        display.textContent = String(value);
        updateFill(slider, min, max, value);
    }
    applyBounds();

    slider.addEventListener("input", () => {
        if (dragAnchor === null) dragAnchor = value;
        const raw     = parseFloat(slider.value);
        const snapped = dragAnchor + Math.round((raw - dragAnchor) / step) * step;
        value = Math.max(min, Math.min(max, Math.round(snapped)));
        rawValue = value;
        slider.value = value;
        display.textContent = String(value);
        updateFill(slider, min, max, value);
    });
    // Drag finished — the next one re-anchors on the value we landed on.
    slider.addEventListener("change", () => { dragAnchor = null; });

    // scroll over display or slider → nudge value by one step
    function onWheelInt(e) {
        e.preventDefault();
        value = Math.max(min, Math.min(max, value + (e.deltaY < 0 ? step : -step)));
        rawValue = value;
        dragAnchor = null;
        slider.value = value;
        display.textContent = String(value);
        updateFill(slider, min, max, value);
    }
    display.addEventListener("wheel", onWheelInt, { passive: false });
    slider.addEventListener("wheel", onWheelInt, { passive: false });

    display.addEventListener("click", () => {
        const edit = document.createElement("input");
        edit.type = "number";
        edit.className = "fsn-edit";
        edit.value = String(value);
        edit.step  = step;
        display.replaceWith(edit);
        edit.focus();
        edit.select();

        function commit() {
            const parsed = parseInt(edit.value);
            if (!isNaN(parsed)) {
                value = Math.max(min, Math.min(max, parsed));
                rawValue = value;
                dragAnchor = null;
            }
            slider.value = value;
            display.textContent = String(value);
            updateFill(slider, min, max, value);
            edit.replaceWith(display);
        }
        edit.addEventListener("blur", commit);
        edit.addEventListener("keydown", (e) => {
            if (e.key === "Enter")  { e.preventDefault(); commit(); }
            if (e.key === "Escape") { edit.replaceWith(display); }
        });
    });

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "fsn-toggle";
    toggleBtn.textContent = "▾ configure";

    wrap.appendChild(display);
    wrap.appendChild(slider);
    wrap.appendChild(toggleBtn);

    return {
        element:      wrap,
        toggleBtn,
        getValue:     ()  => value,
        setValue:     (v) => {
            const parsed = Math.round(parseFloat(v));
            rawValue = isNaN(parsed) ? 0 : parsed;
            applyBounds();
        },
        // Restoring saved configuration — never re-grids. See the float slider.
        updateBounds: (newMin, newMax, newStep) => {
            if (newMin  != null) min  = parseInt(newMin);
            if (newMax  != null) max  = parseInt(newMax);
            if (newStep != null) step = intStep(newStep);
            applyBounds();
        },
        // The user editing the `step` widget — re-grids from min. See the float slider.
        setStep: (newStep) => {
            step       = intStep(newStep);
            rawValue   = Math.round(snapToGrid(rawValue, min, step));
            dragAnchor = null;
            applyBounds();
        },
    };
}

// ---------------------------------------------------------------------------
// Wrap a widget's callback to also run a side-effect
// ---------------------------------------------------------------------------
function wrapCallback(widget, fn) {
    const original = widget.callback;
    widget.callback = function (val, ...rest) {
        original?.call(this, val, ...rest);
        fn(val);
    };
}

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------
app.registerExtension({
    name: "Comfy.FloatSliderNodes",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        const name = nodeData.name;
        const isSimpleFloat = name === "SimpleFloatSlider";
        const isConfigFloat = name === "ConfigurableFloatSlider";
        const isSimpleInt   = name === "ConfigurableIntSlider";

        if (!isSimpleFloat && !isConfigFloat && !isSimpleInt) return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            onNodeCreated?.apply(this, arguments);
            const node = this;

            // -- Pull default value from the Python-created widget then remove it --
            const origIdx   = node.widgets?.findIndex(w => w.name === "value") ?? -1;
            const origValue = origIdx !== -1
                ? (node.widgets[origIdx].value ?? (isSimpleInt ? 50 : 0.5))
                : (isSimpleInt ? 50 : 0.5);
            if (origIdx !== -1) node.widgets.splice(origIdx, 1);

            // ----------------------------------------------------------------
            // Int slider
            // ----------------------------------------------------------------
            if (isSimpleInt) {
                const minW  = node.widgets?.find(w => w.name === "min_value");
                const maxW  = node.widgets?.find(w => w.name === "max_value");
                const stepW = node.widgets?.find(w => w.name === "step");

                const api = buildIntSliderElement(
                    Math.round(origValue),
                    minW?.value  ?? 0,
                    maxW?.value  ?? 100,
                    stepW?.value ?? 1,
                );

                const configWidgets = [minW, maxW, stepW];

                // Toggle button: show/hide the range/step widgets + resize node
                let configVisible = false;
                api.toggleBtn.addEventListener("click", () => {
                    configVisible = !configVisible;
                    configWidgets.forEach(w => {
                        if (!w) return;
                        if (configVisible) {
                            w.type   = w._fsnOrigType ?? w.type;
                            w.hidden = false;
                            delete w.computeSize;
                        } else {
                            w.type        = "hidden";
                            w.hidden      = true;
                            w.computeSize = () => [0, -4];
                        }
                    });
                    api.toggleBtn.textContent = configVisible ? "▴ configure" : "▾ configure";
                    node.setSize([node.size[0], node.computeSize()[1]]);
                });

                const domWidget = node.addDOMWidget("value", "int_slider", api.element, {
                    getValue:     api.getValue,
                    setValue:     api.setValue,
                    getMinHeight: () => 81,
                    getMaxHeight: () => 81,
                });

                // Move DOM widget to index 0 so it appears at the top
                const domIdx = node.widgets.indexOf(domWidget);
                if (domIdx > 0) {
                    node.widgets.splice(domIdx, 1);
                    node.widgets.unshift(domWidget);
                }

                // Wire up min/max/step callbacks so slider reacts to changes
                if (minW)  wrapCallback(minW,  (v) => api.updateBounds(v, null, null));
                if (maxW)  wrapCallback(maxW,  (v) => api.updateBounds(null, v, null));
                if (stepW) wrapCallback(stepW, (v) => api.setStep(v));

                // Loading a workflow restores widget values by direct assignment, which
                // never fires their callbacks — so the slider would keep the defaults it
                // was built with until the user nudged each widget. Pull them in instead.
                node._fsnSync = () => api.updateBounds(minW?.value, maxW?.value, stepW?.value);

                // Defer hiding until after ComfyUI finishes all post-creation setup
                requestAnimationFrame(() => {
                    configWidgets.forEach(w => {
                        if (!w) return;
                        w._fsnOrigType = w.type;
                        w.type         = "hidden";
                        w.hidden       = true;
                        w.computeSize  = () => [0, -4];
                    });
                    node._fsnSync();
                    node.setSize([node.size[0], node.computeSize()[1]]);
                });

                return;
            }

            // ----------------------------------------------------------------
            // Float sliders
            // ----------------------------------------------------------------
            let initMin  = 0.0;
            let initMax  = 1.0;
            let initPrec = 2;
            let initStep = null;
            let minW, maxW, precW, stepW;

            if (isConfigFloat) {
                minW  = node.widgets?.find(w => w.name === "min_value");
                maxW  = node.widgets?.find(w => w.name === "max_value");
                precW = node.widgets?.find(w => w.name === "precision");
                stepW = node.widgets?.find(w => w.name === "step");
                if (minW)  initMin  = minW.value  ?? initMin;
                if (maxW)  initMax  = maxW.value  ?? initMax;
                if (precW) initPrec = precW.value ?? initPrec;
                if (stepW) initStep = stepW.value ?? initStep;
            }

            const api = buildSliderElement(origValue, initMin, initMax, initPrec, initStep, isConfigFloat);

            const domWidget = node.addDOMWidget("value", "float_slider", api.element, {
                getValue:     api.getValue,
                setValue:     api.setValue,
                getMinHeight: () => isConfigFloat ? 81 : 66,
                getMaxHeight: () => isConfigFloat ? 81 : 66,
            });

            // Move DOM widget to index 0 so it appears at the top
            const domIdx = node.widgets.indexOf(domWidget);
            if (domIdx > 0) {
                node.widgets.splice(domIdx, 1);
                node.widgets.unshift(domWidget);
            }

            if (isConfigFloat) {
                if (minW)  wrapCallback(minW,  (v) => api.updateBounds(v, null, null, null));
                if (maxW)  wrapCallback(maxW,  (v) => api.updateBounds(null, v, null, null));
                if (precW) wrapCallback(precW, (v) => api.updateBounds(null, null, v, null));
                if (stepW) wrapCallback(stepW, (v) => api.setStep(v));

                // See the int-slider branch — restored widget values never fire callbacks.
                node._fsnSync = () =>
                    api.updateBounds(minW?.value, maxW?.value, precW?.value, stepW?.value);

                const configWidgets = [minW, maxW, precW, stepW];
                let configVisible = false;
                api.toggleBtn.addEventListener("click", () => {
                    configVisible = !configVisible;
                    configWidgets.forEach(w => {
                        if (!w) return;
                        if (configVisible) {
                            w.type   = w._fsnOrigType ?? w.type;
                            w.hidden = false;
                            delete w.computeSize;
                        } else {
                            w.type        = "hidden";
                            w.hidden      = true;
                            w.computeSize = () => [0, -4];
                        }
                    });
                    api.toggleBtn.textContent = configVisible ? "▴ configure" : "▾ configure";
                    node.setSize([node.size[0], node.computeSize()[1]]);
                });

                requestAnimationFrame(() => {
                    configWidgets.forEach(w => {
                        if (!w) return;
                        w._fsnOrigType = w.type;
                        w.type         = "hidden";
                        w.hidden       = true;
                        w.computeSize  = () => [0, -4];
                    });
                    node._fsnSync();
                    node.setSize([node.size[0], node.computeSize()[1]]);
                });
            }
        };

        // Fires once LiteGraph has restored widgets_values, so the slider can adopt the
        // saved bounds/precision/step. The rAF above is only a fallback for frontends
        // that restore widget values after configure() has already returned.
        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            onConfigure?.apply(this, arguments);
            this._fsnSync?.();
        };
    },
});
