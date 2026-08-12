# ComfyUI Simple Float Slider

Three custom ComfyUI nodes that replace the default number widget with a styled, draggable slider and a prominent live value display.

![Version](https://img.shields.io/badge/version-1.1.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

![All three slider nodes in ComfyUI](screenshots/all-nodes-overview.png)

---

## Nodes

### Simple Float Slider

A fixed-range slider with no configuration required.

![Simple Float Slider](screenshots/simple-float-slider.png)

| Widget | Type | Description |
|--------|------|-------------|
| `value` | slider | Drag to adjust. Click the number to type a value directly. |

| Output | Type | Description |
|--------|------|-------------|
| `float` | FLOAT | Current value, rounded to 2 decimal places |

- Range: `0.00` – `1.00`
- Step: `0.01`
- Precision: 2 decimal places

---

### Configurable Float Slider

A fully configurable slider. All settings update the slider live — no re-queuing needed. Configuration fields are hidden by default behind a `▾ configure` toggle.

![Configurable Float Slider collapsed](screenshots/configurable-float-slider-collapsed.png) ![Configurable Float Slider expanded](screenshots/configurable-float-slider-expanded.png)

| Widget | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | slider | `0.5` | Drag to adjust. Click the number to type a value directly. |
| `min_value` | float | `0.0` | Lower bound of the slider range |
| `max_value` | float | `1.0` | Upper bound of the slider range |
| `precision` | int (0–4) | `2` | Number of decimal places shown in the display |
| `step` | float | `0.01` | Increment size when dragging (e.g. `0.05` snaps to 0.00, 0.05, 0.10 …) |

| Output | Type | Description |
|--------|------|-------------|
| `float` | FLOAT | Current value, clamped to [min, max] and rounded to `precision` decimal places |

> **Note:** `precision` and `step` are independent. You can display 2 decimal places while stepping in increments of `0.25`, for example.

---

### Configurable Int Slider

An integer slider with a configurable range. Configuration fields are hidden by default to keep the node compact.

![Configurable Int Slider collapsed](screenshots/configurable-int-slider-collapsed.png) ![Configurable Int Slider expanded](screenshots/configurable-int-slider-expanded.png)

| Widget | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | slider | `50` | Drag to adjust. Click the number to type a value directly. |
| `min_value` | int | `0` | Lower bound of the slider range (revealed by `▾ set range`) |
| `max_value` | int | `100` | Upper bound of the slider range (revealed by `▾ set range`) |

| Output | Type | Description |
|--------|------|-------------|
| `int` | INT | Current value, clamped to [min, max] |

- Click `▾ set range` to expand the min/max fields; click `▴ set range` to collapse them again.

---

## Slider UI

All three nodes share the same widget style:

- **Large value display** — monospace, centered at the top of the node. Click it to type a value directly; press `Enter` to confirm or `Escape` to cancel.
- **Mouse wheel** — hover over the value display or anywhere on the slider track and scroll to nudge the value. Scroll up to increase, scroll down to decrease. Float sliders increment by the configured `step` size; the int slider increments by `1`. The page canvas will not scroll while the pointer is over the slider.
- **Draggable range slider** — color-filled track: blue left of the thumb, dark right. The fill updates live as you drag.
- **Collapsible configuration** — the Configurable Float Slider (`▾ configure`) and Configurable Int Slider (`▾ set range`) hide their settings fields by default; click the toggle to expand or collapse them.

---

## Installation

1. Clone or copy this folder into your ComfyUI `custom_nodes` directory:

```
ComfyUI/
└── custom_nodes/
    └── ComfyUI-SimpleFloatSlider/
        ├── __init__.py
        ├── nodes.py
        └── js/
            └── slider.js
```

2. Restart ComfyUI.

3. All three nodes appear under **utils/sliders** in the node search.

---

## Requirements

- ComfyUI (any recent version with custom node support)
- No additional Python packages required

---

## Changelog

### v1.1.1

- **Fixed: saved settings were ignored when loading a workflow** — the Configurable Float Slider and Configurable Int Slider rebuilt themselves with their default range on load, so a saved `min_value`, `max_value`, `precision` or `step` had no effect on the slider until you nudged each field and moved it back. The configuration fields displayed the correct saved numbers the whole time, which made the mismatch easy to miss. The slider now reads the restored configuration once the workflow finishes loading.
- **Fixed: values outside the default range were lost on load** — because the slider still held its default bounds while the saved value was being restored, the value was clamped to those defaults. A node saved as `value: 7.5` with `max_value: 10.0` reloaded as `1.0`. The value is now clamped only against the configuration it was actually saved with.
  - Workflows already re-saved after being clamped have the reduced value stored on disk and cannot be recovered automatically.
- **Changed: narrowing a range is no longer destructive** — lowering `max_value` below the current value clamps the display as before, but raising it again restores the original value instead of leaving it stuck at the lower bound. Dragging, scrolling or typing a value still replaces it outright.

### v1.1.0

- **New node: Configurable Int Slider** — a styled integer slider under `utils/sliders`. Outputs `INT`. Defaults to range `0`–`100`.
  - Min and max are configurable directly on the node via a `▾ set range` toggle button that expands/collapses the range fields, keeping the UI clean during normal use.
- **Configurable Float Slider** — the four configuration fields (`min_value`, `max_value`, `precision`, `step`) are now hidden by default behind a `▾ configure` toggle button, consistent with the new int slider behaviour.
- **Mouse wheel support** — on all three nodes, hovering over the value display or the slider track and scrolling up/down increments or decrements the value. Scroll up increases the value, scroll down decreases it. The Configurable Float Slider steps by its configured `step` value; the Simple Float Slider steps by `0.01`; the Configurable Int Slider steps by `1`. The canvas will not scroll while the pointer is over the slider.
