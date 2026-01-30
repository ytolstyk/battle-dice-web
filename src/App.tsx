import { Routes, Route, Link } from "react-router-dom";
import { Home } from "./components/Home";
import { Room } from "./components/Room";
import { useDisclosure } from "@mantine/hooks";
import { AppShell, Group, Burger, Title, Text } from "@mantine/core";
import { NoRoomId } from "./components/NoRoomId";

export function App() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <Title order={3}>Battle Dice</Title>
            <Group ml="xl" gap={0} visibleFrom="sm">
              <Link to="/" onClick={close}>
                <Text p="md">Lobby</Text>
              </Link>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        <Link to="/" onClick={close}>
          <Text p="md">Lobby</Text>
        </Link>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms/" element={<NoRoomId />} />
          <Route path="/rooms/:roomId" element={<Room />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
