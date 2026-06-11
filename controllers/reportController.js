const Staff = require("../models/staff");
const Chargesheet = require("../models/chargesheet");

function assessmentAmountForEntry(entry) {
  const assessments = Number(entry.assessments) || 0;
  const amount = assessments * (Number(entry.assessmentRate) || 0);
  if (assessments > 0 && entry.examType === "Re-ESE") {
    return Math.max(amount, 200);
  }
  return amount;
}

function paperSettingAmountForEntry(entry) {
  if (entry.examType === "Re-ESE") {
    return 0;
  }
  return (Number(entry.paperSets) || 0) * (Number(entry.paperSetRate) || 0);
}

function isRelieverEntry(entry) {
  return String(entry.dutyRole || "").trim().toLowerCase() === "reliever";
}

function relieverSessionCountForEntry(entry) {
  if (Number.isFinite(Number(entry.relieverSessionCount)) && Number(entry.relieverSessionCount) > 0) {
    return Number(entry.relieverSessionCount);
  }

  if (Array.isArray(entry.relieverAssignments)) {
    return entry.relieverAssignments.reduce(
      (total, assignment) => total + (Array.isArray(assignment.rooms) ? assignment.rooms.length : 0),
      0
    );
  }

  return 0;
}

function payableDutyDaysForEntry(entry) {
  if (isRelieverEntry(entry)) {
    const sessions = relieverSessionCountForEntry(entry);
    if (sessions > 0) return sessions / 2;
  }

  if (Number.isFinite(Number(entry.payableDutyDays)) && Number(entry.payableDutyDays) > 0) {
    return Number(entry.payableDutyDays);
  }

  return Number(entry.dutyDays) || 0;
}

function dutyAmountForEntry(entry) {
  return payableDutyDaysForEntry(entry) * (Number(entry.dutyRate) || 0);
}

function totalAmountForEntry(entry) {
  return (
    paperSettingAmountForEntry(entry) +
    assessmentAmountForEntry(entry) +
    (Number(entry.examConduction) || 0) +
    (Number(entry.invigilation) || 0) +
    dutyAmountForEntry(entry)
  );
}

exports.generateReport = async (req, res) => {
  try {
    const { month } = req.query;

    const staffs = await Staff.find();
    const chargesheets = month
      ? await Chargesheet.find({ month })
      : await Chargesheet.find();

    let teachingTotal = 0;
    let nonTeachingTotal = 0;
    let teachingCount = 0;
    let nonTeachingCount = 0;
    let papersSet = 0;
    let assessmentCount = 0;

    const staffTypeById = new Map();

    staffs.forEach((staff) => {
      const type = staff.type?.toLowerCase();
      staffTypeById.set(staff._id.toString(), type);

      if (type === "teaching") {
        teachingCount++;
      } else {
        nonTeachingCount++;
      }
    });

    chargesheets.forEach((cs) => {
      const type = staffTypeById.get(cs.staffId?.toString()) || cs.designation;
      const total = totalAmountForEntry(cs);

      if (type === "teaching") {
        teachingTotal += total;
        papersSet += Number(cs.paperSets || 0);
        assessmentCount += Number(cs.assessments || 0);
      } else {
        nonTeachingTotal += total;
      }
    });

    res.json({
      teachingTotal,
      nonTeachingTotal,
      grandTotal: teachingTotal + nonTeachingTotal,
      teachingCount,
      nonTeachingCount,
      papersSet,
      supervisionCount: assessmentCount,
      extraLectureCount: 0,
      paperRate: 1000,
      lectureRate: 0,
      supervisionRate: 20,
      chargesheets: chargesheets.map((cs) => ({
        _id: cs._id,
        staffName: cs.staffName,
        designation: cs.designation,
        academicYear: cs.academicYear,
        semester: cs.semester,
        examType: cs.examType,
        examMonth: cs.examMonth,
        examPeriod: cs.examPeriod,
        examStartDate: cs.examStartDate,
        examEndDate: cs.examEndDate,
        examLabel: cs.examLabel,
        courseCode: cs.courseCode,
        courseTitle: cs.courseTitle,
        paperSets: cs.paperSets || 0,
        paperSetRate: cs.paperSetRate || 0,
        assessments: cs.assessments || 0,
        assessmentRate: cs.assessmentRate || 0,
        examConduction: cs.examConduction || 0,
        invigilation: cs.invigilation || 0,
        dutyRole: cs.dutyRole || "",
        dutyDates: cs.dutyDates || "",
        dutyDays: cs.dutyDays || 0,
        dutyRate: cs.dutyRate || 0,
        dutyAmount: dutyAmountForEntry(cs),
        payableDutyDays: payableDutyDaysForEntry(cs),
        relieverAssignments: cs.relieverAssignments || [],
        relieverSessionCount: relieverSessionCountForEntry(cs),
        taskCount:
          Number(cs.paperSets || 0) +
          Number(cs.assessments || 0) +
          (Number(cs.examConduction || 0) > 0 ? 1 : 0) +
          (Number(cs.invigilation || 0) > 0 ? 1 : 0),
        total: totalAmountForEntry(cs),
        status: cs.status || "Pending",
      })),
    });
  } catch (error) {
    console.log("REPORT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
