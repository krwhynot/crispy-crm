/**
 * @jest-environment node
 */

import type { Company } from "../../types";
import { getOrganizationAvatar } from "./getOrganizationAvatar";

it("should return favicon URL if website url exist", async () => {
  const website = "https://example.com";
  const record: Partial<Company> = { website };

  const avatarUrl = await getOrganizationAvatar(record);
  expect(avatarUrl).toStrictEqual({
    src: "https://favicon.show/example.com",
    title: "Organization favicon",
  });
});

it("should return null if no website is provided", async () => {
  const record: Partial<Company> = {};

  const avatarUrl = await getOrganizationAvatar(record);
  expect(avatarUrl).toBeNull();
});
