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
            padding: 6px 10px 10px;
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
    `;
    document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function precisionStep(p) {
    return p === 0 ? 1 : parseFloat(Math.pow(10, -p).toFixed(p));
}

function updateFill(slider, min, max, value) {
    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
    const c = Math.max(0, Math.min(100, pct));
    slider.style.setProperty('--fsn-fill', `${c}%`);
}

// ---------------------------------------------------------------------------
// Build the DOM widget element + return a control API
// ---------------------------------------------------------------------------
function buildSliderElement(initValue, initMin, initMax, initPrecision, initStep) {
    let value     = initValue;
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

    function applyBounds() {
        slider.min   = min;
        slider.max   = max;
        slider.step  = step;
        value = Math.max(min, Math.min(max, value));
        slider.value = value;
        display.textContent = value.toFixed(precision);
        updateFill(slider, min, max, value);
    }
    applyBounds();

    // drag
    slider.addEventListener("input", () => {
        value = parseFloat(slider.value);
        display.textContent = value.toFixed(precision);
        updateFill(slider, min, max, value);
    });

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

    wrap.appendChild(display);
    wrap.appendChild(slider);

    return {
        element: wrap,
        getValue:     ()  => value,
        setValue:     (v) => {
            value = Math.max(min, Math.min(max, parseFloat(v) || 0));
            applyBounds();
        },
        updateBounds: (newMin, newMax, newPrecision, newStep) => {
            if (newMin       != null) min       = parseFloat(newMin);
            if (newMax       != null) max       = parseFloat(newMax);
            if (newPrecision != null) precision = parseInt(newPrecision);
            if (newStep      != null) step      = parseFloat(newStep);
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
        if (name !== "SimpleFloatSlider" && name !== "ConfigurableFloatSlider") return;

        const isConfigurable = name === "ConfigurableFloatSlider";

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            onNodeCreated?.apply(this, arguments);
            const node = this;

            // -- Pull default value from the Python-created widget then remove it --
            const origIdx = node.widgets?.findIndex(w => w.name === "value") ?? -1;
            const origValue = origIdx !== -1 ? (node.widgets[origIdx].value ?? 0.5) : 0.5;
            if (origIdx !== -1) node.widgets.splice(origIdx, 1);

            // -- Determine initial bounds --
            let initMin  = 0.0;
            let initMax  = 1.0;
            let initPrec = 2;
            let initStep = null; // null → derived from precision inside buildSliderElement

            if (isConfigurable) {
                const minW  = node.widgets?.find(w => w.name === "min_value");
                const maxW  = node.widgets?.find(w => w.name === "max_value");
                const precW = node.widgets?.find(w => w.name === "precision");
                const stepW = node.widgets?.find(w => w.name === "step");
                if (minW)  initMin  = minW.value  ?? initMin;
                if (maxW)  initMax  = maxW.value  ?? initMax;
                if (precW) initPrec = precW.value ?? initPrec;
                if (stepW) initStep = stepW.value ?? initStep;
            }

            // -- Build the slider DOM widget --
            const api = buildSliderElement(origValue, initMin, initMax, initPrec, initStep);

            const domWidget = node.addDOMWidget("value", "float_slider", api.element, {
                getValue:      api.getValue,
                setValue:      api.setValue,
                getMinHeight:  () => 80,
                getMaxHeight:  () => 80,
            });

            // Move DOM widget to index 0 so it appears at the top
            const domIdx = node.widgets.indexOf(domWidget);
            if (domIdx > 0) {
                node.widgets.splice(domIdx, 1);
                node.widgets.unshift(domWidget);
            }

            // -- For configurable node: live-update slider when config widgets change --
            if (isConfigurable) {
                const minW  = node.widgets?.find(w => w.name === "min_value");
                const maxW  = node.widgets?.find(w => w.name === "max_value");
                const precW = node.widgets?.find(w => w.name === "precision");
                const stepW = node.widgets?.find(w => w.name === "step");

                if (minW)  wrapCallback(minW,  (v) => api.updateBounds(v, null, null, null));
                if (maxW)  wrapCallback(maxW,  (v) => api.updateBounds(null, v, null, null));
                if (precW) wrapCallback(precW, (v) => api.updateBounds(null, null, v, null));
                if (stepW) wrapCallback(stepW, (v) => api.updateBounds(null, null, null, v));
            }
        };
    },
});
