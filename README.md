# ComfyUI Simple Float Slider

Two custom ComfyUI nodes that replace the default number widget with a styled, draggable slider and a prominent live value display.

---

## Nodes

### Simple Float Slider

A fixed-range slider with no configuration required.

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

A fully configurable slider. All settings update the slider live — no re-queuing needed.

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

## Slider UI

Both nodes share the same widget style:

- **Large value display** — monospace, centered at the top of the node. Click it to type a value directly; press `Enter` to confirm or `Escape` to cancel.
- **Draggable range slider** — color-filled track (blue left of thumb, dark right). The fill updates as you drag.
- **Live configuration** (Configurable node only) — changing `min_value`, `max_value`, `precision`, or `step` immediately updates the slider without touching the queue.

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

3. Both nodes appear under **utils/sliders** in the node search.

---

## Requirements

- ComfyUI (any recent version with custom node support)
- No additional Python packages required
