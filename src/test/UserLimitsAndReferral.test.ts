import { describe, it, expect } from "vitest";
import {
  BASE_ADMIN_STAFF_LIMIT,
  EXTRA_USER_SEAT_PRICE_TZS,
  REFERRAL_DISCOUNT_PERCENT,
  MANUAL_MONTHLY_PRICE_TZS,
  calculateSubscriptionBreakdown,
} from "@/lib/subscription";

describe("User Seat Limits & Referral Discount System", () => {
  describe("Core Business Constants", () => {
    it("enforces a base limit of 4 staff users under the admin", () => {
      expect(BASE_ADMIN_STAFF_LIMIT).toBe(4);
    });

    it("charges 5,000 TZS per additional user space", () => {
      expect(EXTRA_USER_SEAT_PRICE_TZS).toBe(5000);
    });

    it("grants a 5% discount on the next subscription renewal for referrals", () => {
      expect(REFERRAL_DISCOUNT_PERCENT).toBe(5);
    });

    it("has standard manual monthly price of 25,000 TZS", () => {
      expect(MANUAL_MONTHLY_PRICE_TZS).toBe(25000);
    });
  });

  describe("Subscription & Pricing Breakdown Calculations", () => {
    it("calculates standard base subscription without extra seats or referral discount", () => {
      const breakdown = calculateSubscriptionBreakdown({
        basePrice: 25000,
        extraSeats: 0,
        hasReferralDiscount: false,
      });

      expect(breakdown.basePrice).toBe(25000);
      expect(breakdown.extraSeats).toBe(0);
      expect(breakdown.extraSeatsCost).toBe(0);
      expect(breakdown.subtotal).toBe(25000);
      expect(breakdown.hasReferralDiscount).toBe(false);
      expect(breakdown.discountPercent).toBe(0);
      expect(breakdown.discountAmount).toBe(0);
      expect(breakdown.total).toBe(25000);
    });

    it("calculates subscription with extra user spaces (5,000 TZS each)", () => {
      const oneExtra = calculateSubscriptionBreakdown({
        basePrice: 25000,
        extraSeats: 1,
        hasReferralDiscount: false,
      });
      expect(oneExtra.extraSeatsCost).toBe(5000);
      expect(oneExtra.total).toBe(30000);

      const threeExtra = calculateSubscriptionBreakdown({
        basePrice: 25000,
        extraSeats: 3,
        hasReferralDiscount: false,
      });
      expect(threeExtra.extraSeatsCost).toBe(15000);
      expect(threeExtra.total).toBe(40000);
    });

    it("applies 5% referral discount on base subscription", () => {
      const breakdown = calculateSubscriptionBreakdown({
        basePrice: 25000,
        extraSeats: 0,
        hasReferralDiscount: true,
      });

      expect(breakdown.hasReferralDiscount).toBe(true);
      expect(breakdown.discountPercent).toBe(5);
      // 5% of 25,000 = 1,250 TZS
      expect(breakdown.discountAmount).toBe(1250);
      // 25,000 - 1,250 = 23,750 TZS
      expect(breakdown.total).toBe(23750);
    });

    it("applies 5% referral discount on combined base and extra seats", () => {
      const breakdown = calculateSubscriptionBreakdown({
        basePrice: 25000,
        extraSeats: 2, // 2 * 5,000 = 10,000 -> subtotal 35,000
        hasReferralDiscount: true,
      });

      expect(breakdown.subtotal).toBe(35000);
      // 5% of 35,000 = 1,750 TZS
      expect(breakdown.discountAmount).toBe(1750);
      // 35,000 - 1,750 = 33,250 TZS
      expect(breakdown.total).toBe(33250);
    });

    it("sanitizes negative or invalid extra seats input", () => {
      const breakdown = calculateSubscriptionBreakdown({
        basePrice: 25000,
        extraSeats: -5,
        hasReferralDiscount: false,
      });

      expect(breakdown.extraSeats).toBe(0);
      expect(breakdown.extraSeatsCost).toBe(0);
      expect(breakdown.total).toBe(25000);
    });
  });

  describe("Shop Seat Capacity Verification Logic", () => {
    function evaluateCapacity(
      users: { role: string }[],
      extraSeats: number = 0
    ) {
      const maxAllowed = BASE_ADMIN_STAFF_LIMIT + Math.max(0, extraSeats);
      const assignedStaff = users.filter((u) => u.role !== "owner").length;
      return {
        maxAllowed,
        assignedStaff,
        canAddUser: assignedStaff < maxAllowed,
        remainingSpaces: Math.max(0, maxAllowed - assignedStaff),
      };
    }

    it("allows adding users when under the 4 base limit", () => {
      const team = [
        { role: "owner" },
        { role: "cashier" },
        { role: "staff" },
      ];
      const res = evaluateCapacity(team, 0);

      expect(res.maxAllowed).toBe(4);
      expect(res.assignedStaff).toBe(2);
      expect(res.canAddUser).toBe(true);
      expect(res.remainingSpaces).toBe(2);
    });

    it("blocks adding users when exactly 4 users are assigned under admin", () => {
      const team = [
        { role: "owner" },
        { role: "manager" },
        { role: "cashier" },
        { role: "staff" },
        { role: "hr" },
      ];
      const res = evaluateCapacity(team, 0);

      expect(res.maxAllowed).toBe(4);
      expect(res.assignedStaff).toBe(4);
      expect(res.canAddUser).toBe(false);
      expect(res.remainingSpaces).toBe(0);
    });

    it("unblocks adding users when extra seats are purchased", () => {
      const team = [
        { role: "owner" },
        { role: "manager" },
        { role: "cashier" },
        { role: "staff" },
        { role: "hr" },
      ];
      // 4 assigned, but 2 extra seats purchased -> total allowed is 6
      const res = evaluateCapacity(team, 2);

      expect(res.maxAllowed).toBe(6);
      expect(res.assignedStaff).toBe(4);
      expect(res.canAddUser).toBe(true);
      expect(res.remainingSpaces).toBe(2);
    });

    it("never counts the shop owner against the 4 assigned staff limit", () => {
      const teamOnlyOwner = [{ role: "owner" }];
      const res = evaluateCapacity(teamOnlyOwner, 0);

      expect(res.assignedStaff).toBe(0);
      expect(res.canAddUser).toBe(true);
      expect(res.remainingSpaces).toBe(4);
    });
  });
});
