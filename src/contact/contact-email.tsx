/**
 * The contact email, as a React Email template. Resend renders this to HTML when
 * `createResendSender` (adapters.tsx) passes it as the message body. It is only
 * ever reached through the production send adapter, never the seam-#2 tests.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ContactEmailProps {
  readonly email: string;
  readonly message: string;
  readonly name: string;
}

const body = {
  backgroundColor: "#0b0e14",
  color: "#ece6d8",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const container = {
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px 24px",
};

const heading = {
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const label = {
  color: "#8b93a7",
  fontSize: "11px",
  letterSpacing: "0.08em",
  margin: "16px 0 4px",
  textTransform: "uppercase" as const,
};

const value = {
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const rule = {
  borderColor: "#222838",
  margin: "20px 0",
};

export function ContactEmail({ email, message, name }: ContactEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`New message from ${name}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>New message from the contact door</Heading>
          <Hr style={rule} />
          <Section>
            <Text style={label}>From</Text>
            <Text style={value}>{`${name} <${email}>`}</Text>
            <Text style={label}>Message</Text>
            <Text style={value}>{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
