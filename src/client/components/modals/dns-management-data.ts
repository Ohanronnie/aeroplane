import cloudflareLogoUrl from "../../assets/dns-providers/cloudflare.svg";
import namecheapLogoUrl from "../../assets/dns-providers/namecheap.svg";
import spaceshipLogoUrl from "../../assets/dns-providers/spaceship.svg";
import type { DnsProviderId } from "../../api";

export type { DnsProviderId };

export type DnsCredentialField = {
  key: string;
  label: string;
  placeholder: string;
  type?: "password" | "text";
  required?: boolean;
};

export type DnsProviderDefinition = {
  id: DnsProviderId;
  name: string;
  logoUrl: string;
  fields: DnsCredentialField[];
  primarySecretKey: string;
};

export type DnsCredentialValues = Record<string, string>;

export type DnsProviderConnection = {
  connected: boolean;
  keySuffix: string;
  savedAt: string;
};

export const dnsProviders: DnsProviderDefinition[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    logoUrl: cloudflareLogoUrl,
    primarySecretKey: "apiToken",
    fields: [
      {
        key: "apiToken",
        label: "API key / token",
        placeholder: "Cloudflare API key or DNS token",
        type: "password",
        required: true
      },
      {
        key: "accountEmail",
        label: "Account email",
        placeholder: "Only needed for global API keys",
        type: "text"
      },
      {
        key: "zoneId",
        label: "Zone ID",
        placeholder: "Optional zone ID",
        type: "text"
      }
    ]
  },
  {
    id: "namecheap",
    name: "Namecheap",
    logoUrl: namecheapLogoUrl,
    primarySecretKey: "apiKey",
    fields: [
      {
        key: "apiUser",
        label: "API user",
        placeholder: "Namecheap username",
        type: "text",
        required: true
      },
      {
        key: "apiKey",
        label: "API key",
        placeholder: "Namecheap API key",
        type: "password",
        required: true
      },
      {
        key: "clientIp",
        label: "Client IP",
        placeholder: "Whitelisted server IP",
        type: "text"
      }
    ]
  },
  {
    id: "spaceship",
    name: "Spaceship",
    logoUrl: spaceshipLogoUrl,
    primarySecretKey: "apiKey",
    fields: [
      {
        key: "apiKey",
        label: "API key",
        placeholder: "Spaceship API key",
        type: "password",
        required: true
      },
      {
        key: "apiSecret",
        label: "API secret",
        placeholder: "Spaceship API secret",
        type: "password",
        required: true
      }
    ]
  }
];

export function blankCredentials(provider: DnsProviderDefinition) {
  return provider.fields.reduce<DnsCredentialValues>((fields, field) => {
    fields[field.key] = "";
    return fields;
  }, {});
}

export function createDnsCredentials() {
  return dnsProviders.reduce<Record<DnsProviderId, DnsCredentialValues>>((credentials, provider) => {
    credentials[provider.id] = blankCredentials(provider);
    return credentials;
  }, {} as Record<DnsProviderId, DnsCredentialValues>);
}

export function createDnsConnections() {
  return dnsProviders.reduce<Record<DnsProviderId, DnsProviderConnection>>((connections, provider) => {
    connections[provider.id] = {
      connected: false,
      keySuffix: "",
      savedAt: ""
    };
    return connections;
  }, {} as Record<DnsProviderId, DnsProviderConnection>);
}
