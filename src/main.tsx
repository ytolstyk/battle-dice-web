import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { UserProvider } from "./components/UserProvider.tsx";

const theme = createTheme({});
const metaTag = document.createElement("meta");
metaTag.setAttribute("c", __COMMIT_HASH__);
document.getElementsByTagName("head")[0].append(metaTag);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <MantineProvider theme={theme}>
      <Notifications />
      <BrowserRouter>
        <ModalsProvider>
          <App />
        </ModalsProvider>
      </BrowserRouter>
    </MantineProvider>
  </UserProvider>,
);
