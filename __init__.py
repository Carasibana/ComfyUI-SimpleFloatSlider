from .nodes import ConfigurableIntSlider, SimpleFloatSlider, ConfigurableFloatSlider

NODE_CLASS_MAPPINGS = {
    "ConfigurableIntSlider": ConfigurableIntSlider,
    "SimpleFloatSlider": SimpleFloatSlider,
    "ConfigurableFloatSlider": ConfigurableFloatSlider,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ConfigurableIntSlider": "Configurable Int Slider",
    "SimpleFloatSlider": "Simple Float Slider",
    "ConfigurableFloatSlider": "Configurable Float Slider",
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
