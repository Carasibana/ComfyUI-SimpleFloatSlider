from .nodes import SimpleFloatSlider, ConfigurableFloatSlider

NODE_CLASS_MAPPINGS = {
    "SimpleFloatSlider": SimpleFloatSlider,
    "ConfigurableFloatSlider": ConfigurableFloatSlider,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SimpleFloatSlider": "Simple Float Slider",
    "ConfigurableFloatSlider": "Configurable Float Slider",
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
