/**
 * Imports every model for its registration side effect. connectDB() pulls this
 * in so that `.populate()` on any ref works regardless of which models the
 * calling file happened to import. Add new models here as they're created.
 */
import "@/models/User";
import "@/models/Employee";
import "@/models/Department";
import "@/models/Project";
import "@/models/AuditLog";
import "@/models/LeaveType";
import "@/models/Contract";
import "@/models/Leave";
import "@/models/Custody";
import "@/models/EmployeeRequest";
import "@/models/License";
import "@/models/Task";
import "@/models/Vehicle";
import "@/models/Accident";
import "@/models/Maintenance";
import "@/models/ThirdPartyAccount";
import "@/models/Company";
import "@/models/Warehouse";
import "@/models/InventoryItem";
import "@/models/PurchaseOrder";
import "@/models/Deal";
import "@/models/Contact";
import "@/models/SalesTarget";
import "@/models/SiteSetting";
import "@/models/Article";
import "@/models/Job";
import "@/models/ClientLogo";
import "@/models/Submission";

export {};
