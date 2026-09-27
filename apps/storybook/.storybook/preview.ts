import type { Preview } from "@storybook/react-vite";
import "./tokens.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        background: { name: "background", value: "#faf8f6" },
        card: { name: "card", value: "#ffffff" },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "background" },
  },
};

export default preview;
