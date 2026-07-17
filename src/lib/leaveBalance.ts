import "server-only";
import { connectDB } from "@/lib/db";
import { Contract } from "@/models/Contract";
import { Leave } from "@/models/Leave";
import { LeaveType } from "@/models/LeaveType";
import { startOfDay } from "@/lib/utils";

export interface LeaveBalance {
  /** Days granted per full year by the active contract. */
  annualEntitlement: number;
  /** Entitlement accrued from contract start up to today, pro-rated by day. */
  accruedToDate: number;
  /** Days already consumed by approved, balance-affecting leaves. */
  taken: number;
  /** accruedToDate − taken, floored at zero. */
  available: number;
  contractStart: Date | null;
}

const EMPTY: LeaveBalance = {
  annualEntitlement: 0,
  accruedToDate: 0,
  taken: 0,
  available: 0,
  contractStart: null,
};

/**
 * Computes an employee's leave balance the way the business explained it: the
 * contract grants N days per year, and entitlement accrues day-by-day from the
 * contract start date. So on day D of the contract, accrued = N * (D / 365).
 * Approved leaves whose type affects the balance are subtracted.
 */
export async function computeLeaveBalance(
  employeeId: string,
  asOf: Date = new Date(),
): Promise<LeaveBalance> {
  await connectDB();

  const contract = await Contract.findOne({
    employee: employeeId,
    status: "active",
  })
    .sort({ startDate: -1 })
    .lean();

  if (!contract || !contract.startDate) return EMPTY;

  const annual = contract.annualLeaveDays ?? 0;
  const start = startOfDay(new Date(contract.startDate));
  const today = startOfDay(asOf);

  const elapsedDays = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / 86_400_000),
  );
  const accruedToDate = Math.round((annual * (elapsedDays / 365)) * 100) / 100;

  // Only approved leaves of balance-affecting types count against the balance.
  const affectingTypeIds = (await LeaveType.find({ affectsBalance: true }).distinct("_id")).map(
    String,
  );

  const approved = await Leave.find({
    employee: employeeId,
    status: "approved",
    leaveType: { $in: affectingTypeIds },
  })
    .select("days")
    .lean();

  const taken = approved.reduce((sum, l) => sum + (l.days ?? 0), 0);
  const available = Math.max(0, Math.round((accruedToDate - taken) * 100) / 100);

  return {
    annualEntitlement: annual,
    accruedToDate,
    taken,
    available,
    contractStart: start,
  };
}
