class ConfigurableIntSlider:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "value": ("INT", {
                    "default": 50,
                    "min": -1000000,
                    "max": 1000000,
                    "step": 1,
                }),
                "min_value": ("INT", {
                    "default": 0,
                    "min": -1000000,
                    "max": 1000000,
                    "step": 1,
                }),
                "max_value": ("INT", {
                    "default": 100,
                    "min": -1000000,
                    "max": 1000000,
                    "step": 1,
                }),
                "step": ("INT", {
                    "default": 1,
                    "min": 1,
                    "max": 1000000,
                    "step": 1,
                }),
            }
        }

    RETURN_TYPES = ("INT",)
    RETURN_NAMES = ("int",)
    FUNCTION = "execute"
    CATEGORY = "utils/sliders"

    def execute(self, value, min_value, max_value, step):
        return (max(int(min_value), min(int(max_value), int(value))),)


class SimpleFloatSlider:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "value": ("FLOAT", {
                    "default": 0.5,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.01,
                }),
            }
        }

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("float",)
    FUNCTION = "execute"
    CATEGORY = "utils/sliders"

    def execute(self, value):
        return (round(float(value), 2),)


class ConfigurableFloatSlider:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "value": ("FLOAT", {
                    "default": 0.5,
                    "min": -10000.0,
                    "max": 10000.0,
                    "step": 0.0001,
                }),
                "min_value": ("FLOAT", {
                    "default": 0.0,
                    "min": -10000.0,
                    "max": 10000.0,
                    "step": 0.01,
                }),
                "max_value": ("FLOAT", {
                    "default": 1.0,
                    "min": -10000.0,
                    "max": 10000.0,
                    "step": 0.01,
                }),
                "precision": ("INT", {
                    "default": 2,
                    "min": 0,
                    "max": 4,
                    "step": 1,
                }),
                "step": ("FLOAT", {
                    "default": 0.01,
                    "min": 0.0001,
                    "max": 1000.0,
                    "step": 0.01,
                }),
            }
        }

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("float",)
    FUNCTION = "execute"
    CATEGORY = "utils/sliders"

    def execute(self, value, min_value, max_value, precision, step):
        clamped = max(float(min_value), min(float(max_value), float(value)))
        return (round(clamped, int(precision)),)
