export const COURSE_CATALOG = {
  "Sem I": [
    { code: "R5MC5011S", title: "Management Information System" },
    { code: "R5MC5012T", title: "Software Engineering & Project Management" },
    { code: "R5MC5013T", title: "Operating System" },
    { code: "R5MC5013P", title: "Operating System Lab", kind: "lab" },
    { code: "R5MC5014S", title: "Mathematical and Statistical Foundations 1" },
    { code: "R5MC5015S", title: "Accounting and Finance(MOOC)" },
    { code: "R5MC5016L", title: "Business English" },
    { code: "R5MC5017L", title: "Mobile Computing Lab", kind: "lab" },
    { code: "R5MC5018L", title: "Web Technology Lab (Node Js, Angular Js, React, Flutter)", kind: "lab" },
    { code: "R5MC5019D", title: "Mini Project I (Based on SSAD, OOAD and User Experience Design Principles)", kind: "lab" },
  ],
  "Sem II": [
    { code: "R5MC5021T", title: "Data Mining" },
    { code: "R5MC5022T", title: "Design and Analysis of Algorithm" },
    { code: "R5MC5023S", title: "Mathematical and Statistical Foundation II" },
    { code: "R5MC5027T", title: "Professional Communication" },
    { code: "R5MC5111S", title: "Computer Graphics & Animation" },
    { code: "R5MC5112S", title: "Digital Forensics" },
    { code: "R5MC5113S", title: "Cloud Computing" },
    { code: "R5MC5114S", title: "Data Warehousing" },
    { code: "R5MC5115S", title: "Entrepreneurship Management and IPR" },
    { code: "R5MC5121T", title: "Multimedia System" },
    { code: "R5MC5122T", title: "Image Processing" },
    { code: "R5MC5123T", title: "Software Design and Pattern" },
    { code: "R5MC5124T", title: "Ethical Hacking" },
    { code: "R5MC5125T", title: "Internet of Things" },
    { code: "R5MC5121P", title: "Multimedia System Lab", kind: "lab" },
    { code: "R5MC5122P", title: "Image Processing Lab", kind: "lab" },
    { code: "R5MC5123P", title: "Software Design and Pattern Lab", kind: "lab" },
    { code: "R5MC5124P", title: "Ethical Hacking Lab", kind: "lab" },
    { code: "R5MC5125P", title: "Internet of Things Lab", kind: "lab" },
    { code: "R5MC5021P", title: "Data Mining Lab", kind: "lab" },
    { code: "R5MC5022P", title: "Design and Analysis of Algorithm Lab", kind: "lab" },
    { code: "R5MC5025L", title: "Java and Python Lab", kind: "lab" },
    { code: "R5MC5026D", title: "Mini Project 2 (Based on RDBMS and User Experience Design Principles)", kind: "lab" },
  ],
  "Sem III": [
    { code: "R5MC6011T", title: "Big Data Analytics and Visualization" },
    { code: "R5MC6011P", title: "Big Data Analytics and Visualization Lab", kind: "lab" },
    { code: "R5MC6012T", title: "Artificial Intelligence and Machine learning" },
    { code: "R5MC6012P", title: "Artificial Intelligence and Machine learning Lab", kind: "lab" },
    { code: "R5MC6013S", title: "Data Science" },
    { code: "R5MC6014T", title: "Information and network security" },
    { code: "R5MC6014P", title: "Information and network security Lab", kind: "lab" },
    { code: "R5MC6111T", title: "Geographic Information Systems" },
    { code: "R5MC6111P", title: "Geographic Information Systems Lab", kind: "lab" },
    { code: "R5MC6112T", title: "Gaming Technology" },
    { code: "R5MC6112P", title: "Gaming Technology Lab", kind: "lab" },
    { code: "R5MC6113T", title: "Robotics" },
    { code: "R5MC6113P", title: "Robotics Lab", kind: "lab" },
    { code: "R5MC6115T", title: "Deep learning" },
    { code: "R5MC6115P", title: "Deep learning Lab", kind: "lab" },
  ],
};

export const SEMESTERS = Object.keys(COURSE_CATALOG);

export function getCoursesForSemester(semester) {
  return COURSE_CATALOG[semester] || [];
}

export function formatCourse(course) {
  if (!course) return "";
  return `${course.code} ${course.title}`;
}
