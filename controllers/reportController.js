const Staff = require("../models/staff");
const Chargesheet = require("../models/chargesheet");

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

      if (type === "teaching") {
        teachingTotal += cs.total || 0;
        papersSet += Number(cs.paperSets || 0);
        assessmentCount += Number(cs.assessments || 0);
      } else {
        nonTeachingTotal += cs.total || 0;
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
        examLabel: cs.examLabel,
        courseCode: cs.courseCode,
        courseTitle: cs.courseTitle,
        paperSets: cs.paperSets || 0,
        paperSetRate: cs.paperSetRate || 0,
        assessments: cs.assessments || 0,
        assessmentRate: cs.assessmentRate || 0,
        examConduction: cs.examConduction || 0,
        invigilation: cs.invigilation || 0,
        taskCount:
          Number(cs.paperSets || 0) +
          Number(cs.assessments || 0) +
          (Number(cs.examConduction || 0) > 0 ? 1 : 0) +
          (Number(cs.invigilation || 0) > 0 ? 1 : 0),
        total: cs.total || 0,
        status: cs.status || "Pending",
      })),
    });
  } catch (error) {
    console.log("REPORT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
