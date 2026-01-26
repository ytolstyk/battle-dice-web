import { Box, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function NoRoomId() {
  const [num, setNum] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    if (num === 0) {
      navigate(`/`);
      return;
    }

    const timer = setTimeout(() => {
      setNum(num - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, num]);

  return (
    <Box p="md">
      <Title order={2} ta="center" mb="md">
        You got lost somewhere along the way
      </Title>
      <Box ta="center">Fear not, you'll go home in {num} seconds.</Box>
    </Box>
  );
}
