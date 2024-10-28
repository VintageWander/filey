import { Button, Text, CopyButton as CopyButtonInner } from "@mantine/core";
import { FiCheck, FiCopy } from "react-icons/fi";

// Copy link button, copy icon will change to check icon on click
export const CopyButton = ({
  url,
  title = "Copy link",
}: {
  url: string;
  title?: string;
}) => {
  return (
    <CopyButtonInner value={url} timeout={1500}>
      {({ copied, copy }) => (
        <Button
          h={title === "Copy link" ? "35px" : "55px"}
          px="10px"
          color={copied ? "teal" : "cyan"}
          variant="subtle"
          onClick={copy}
          leftSection={copied ? <FiCheck /> : <FiCopy />}
        >
          {title === "Copy link" ? (
            title
          ) : (
            <Text my="10px" style={{ textWrap: "wrap" }}>
              {title}
            </Text>
          )}
        </Button>
      )}
    </CopyButtonInner>
  );
};
