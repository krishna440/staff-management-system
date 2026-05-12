import React from "react";
import StaffDirectory from "../components/StaffDirectory";

const NonTeaching = () => (
  <StaffDirectory
    type="Non-Teaching"
    title="Non-Teaching Staff"
    subtitle="Support and administrative members"
    accent="#085041"
    softAccent="#E1F5EE"
    pdfName="non_teaching_staff.pdf"
  />
);

export default NonTeaching;
