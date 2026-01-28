import { Button, Center, TextInput } from "@mantine/core";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import { modals } from "@mantine/modals";

export function AddUserName() {
  const { saveUserName } = useContext(UserContext);
  const [name, setName] = useState("Drama Llama");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const handleSetName = (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
  ): void => {
    e.preventDefault();

    if (!name) {
      setErrors({ name: "Please enter your name before joining a room." });
      return;
    }

    saveUserName(name);
    modals.closeAll();
  };

  return (
    <form onSubmit={handleSetName}>
      <TextInput
        placeholder="Your Name"
        value={name}
        onChange={handleTextChange}
        error={errors.name}
        ta="center"
        mb="md"
      />
      <Center>
        <Button onClick={handleSetName}>Set name</Button>
      </Center>
    </form>
  );
}
