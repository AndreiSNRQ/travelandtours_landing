import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TermsAndConditions() {
  const [openTerms, setOpenTerms] = useState(false);

  return (
    <div className="text-sm text-muted-foreground mt-4 px-2 text-center">
      By logging in, you agree to our{" "}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpenTerms(true);
        }}
        className="text-blue-600 hover:underline cursor-pointer"
      >
        Terms and Conditions
      </a>{" "}
      and{" "}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Privacy Policy
      </a>
      . Please make sure to read and understand them before accessing your
      account.

      {/* Terms Dialog */}
      <Dialog open={openTerms} onOpenChange={setOpenTerms}>
        <DialogContent
          className="max-w-4xl max-h-[85vh] overflow-y-auto"
          style={{ backgroundColor: 'oklch(0.205 0 0)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              TERMS AND CONDITIONS
            </DialogTitle>
          </DialogHeader>

          <div className="text-sm leading-relaxed text-justify space-y-4 px-1" style={{ color: 'oklch(0.922 0 0)' }}>
            <p>
              These Terms and Conditions (“Terms”) govern your access to and use
              of the <strong>Joli Travel and Tours Human Resources 4 (HR4) System</strong>,
              including its modules for employee data management, payroll
              processing, compensation planning, HMO and benefits administration,
              and HR analytics dashboard (collectively referred to as the “System”).
              By accessing or using the HR4 System, you agree to comply with and
              be bound by these Terms, including any updates or revisions made by
              the HR Department. The System is designed exclusively for authorized
              HR administrators and payroll specialists to ensure the secure,
              lawful, and confidential handling of employee information in
              accordance with the <strong>Data Privacy Act of 2012</strong> and
              the guidelines set by the <strong>National Privacy Commission (NPC)</strong>.
            </p>

            <h3 className="font-semibold mt-4">I. Purpose</h3>
            <p>
              The HR4 Management System is developed for Joli Travel and Tours to
              support the Human Resources department in securely and efficiently
              managing employee information, payroll processing, compensation
              planning, HMO and benefits, and HR analytics dashboards. This system
              ensures data accuracy, transparency, and compliance with national
              data protection standards.
            </p>

            <h3 className="font-semibold mt-4">II. Authorized Use</h3>
            <p>
              Access to the HR4 System is limited to authorized HR administrators,
              payroll specialists, and system administrators. Users must access
              and process employee data only for legitimate business and HR
              purposes such as payroll computation, benefits administration, and
              performance monitoring.
            </p>

            <h3 className="font-semibold mt-4">III. Data Privacy and Legal Compliance</h3>
            <p>
              All data within the HR4 System are considered confidential and
              sensitive under the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Users must handle personal and employment-related information with the highest level of confidentiality.</li>
              <li>Data such as employee salary, health benefits, government contributions, and identification numbers (e.g., SSS, PhilHealth, Pag-IBIG, TIN) must never be disclosed or transferred outside authorized channels.</li>
              <li>Violation of data privacy policies may result in administrative sanctions and penalties under the Data Privacy Act and company policies.</li>
            </ul>

            <h3 className="font-semibold mt-4">IV. Account and System Security</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use only assigned login credentials; sharing or reusing another user’s account is prohibited.</li>
              <li>Always log out after each session, especially on shared or public computers.</li>
              <li>Report any suspicious login attempts, data breaches, or unauthorized access to the IT Security Team immediately.</li>
            </ul>

            <h3 className="font-semibold mt-4">V. Data Integrity and Accuracy</h3>
            <p>
              HR personnel must ensure all employee records, payroll entries, and
              benefit details are accurate and verified. Any detected errors,
              duplication, or inconsistencies must be corrected promptly and
              reported to the HRIS Administrator to maintain data integrity across
              all modules.
            </p>

            <h3 className="font-semibold mt-4">VI. Core Functional Modules</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Employee Records: Centralized repository of employee information, job assignments, and performance data.</li>
              <li>Payroll Management: Automates payroll generation, deductions, tax computations, and government remittances.</li>
              <li>Compensation Planning: Supports salary reviews, bonus allocations, and performance-based incentives.</li>
              <li>HMO & Benefits Administration: Manages healthcare plans, reimbursements, and employee benefit programs.</li>
              <li>HR Analytics Dashboard: Provides real-time insights on workforce data, attendance, and attrition trends.</li>
            </ul>

            <h3 className="font-semibold mt-4">VII. Data Security and Encryption</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>All employee information processed through the HR4 system must be transmitted and stored securely using encryption and restricted database access.</li>
              <li>Only authorized HR staff and system administrators can view or modify sensitive data.</li>
              <li>Downloading or exporting files containing personal information must be limited to official use and secured storage.</li>
            </ul>

            <h3 className="font-semibold mt-4">VIII. Confidentiality and Obligations</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Information accessed or processed by HR personnel is the sole property of Joli Travel and Tours.</li>
              <li>Employees are strictly prohibited from sharing, printing, or disclosing confidential records without managerial approval.</li>
              <li>Use of employee information for personal gain or outside business activities is strictly prohibited.</li>
            </ul>

            <h3 className="font-semibold mt-4">IX. Monitoring and Compliance</h3>
            <p>
              The HRIS Administrator monitors system access, changes, and data
              transactions. Logs are regularly reviewed for compliance. Any misuse
              or breach of policy will result in disciplinary action and may lead
              to termination of access or employment.
            </p>

            <h3 className="font-semibold mt-4">X. Restriction of Use</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Editing or deleting employee data without proper authorization.</li>
              <li>Using system reports for non-HR or personal purposes.</li>
              <li>Sharing screenshots, exports, or analytics data with unauthorized individuals.</li>
            </ul>

            <h3 className="font-semibold mt-4">XI. Technical Support and Maintenance</h3>
            <p>
              Technical concerns, login issues, or data errors should be
              immediately reported to the HRIS Support Team. Scheduled maintenance
              updates will be communicated in advance to minimize disruption.
            </p>

            <h3 className="font-semibold mt-4">XII. Legal Framework and Governing Law</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Republic Act No. 10173 – Data Privacy Act of 2012</li>
              <li>The National Privacy Commission (NPC) Guidelines on the protection, processing, and management of employee data.</li>
            </ul>

            <h3 className="font-semibold mt-4">XIII. Acceptance of Terms</h3>
            <p>
              By logging into the HR4 Management System, you acknowledge that you
              have read, understood, and agreed to comply with these Terms of Use.
              Violation of these terms may result in system access revocation,
              disciplinary measures, and potential legal consequences under
              Philippine law.
            </p>

            <p className="mt-4 text-xs italic text-center">
              Effective Date: October 2025 <br />
              Department: Human Resources – Joli Travel and Tours
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={() => setOpenTerms(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
