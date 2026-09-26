import { createSimplePdf, type PdfSection } from "@/lib/pdf/simple-pdf";

export type LegalDocumentType = "nda" | "dataSubmission";

export type SignedLegalDocument = {
  document: LegalDocumentType;
  signedAt: string;
  signerName: string;
  signerTitle: string;
  signatureText: string;
};

const ndaSections: PdfSection[] = [
  {
    heading: "Parties and purpose",
    lines: [
      'This Non-Disclosure Agreement (the "Agreement") is entered into as of the date of the last signature below (the "Effective Date") by and between Cronus Technologies, Inc., d/b/a Trinity-AI (the "Discloser" or "Trinity-AI") and the contractor identified below (the "Recipient"). The Discloser intends to provide certain confidential information to the Recipient in connection with the Recipient\'s performance of services for Trinity-AI (the "Purpose"). In consideration of receiving such Confidential Information, the Recipient agrees as follows:',
    ],
  },
  {
    heading: "1. Definition of Confidential Information",
    lines: [
      '"Confidential Information" means any information or data disclosed by the Discloser to the Recipient, whether in oral, written, electronic, or any other form, that is either (a) clearly marked or identified as "confidential" or "proprietary" at the time of disclosure, or (b) such that a reasonable person would understand it to be confidential given the nature of the information and the circumstances surrounding its disclosure. Confidential Information includes, but is not limited to, business plans, technical data, product plans, strategies, financial information, customer lists, and other sensitive business information.',
    ],
  },
  {
    heading: "2. Obligations of the Recipient",
    lines: [
      "(a) Non-Disclosure. The Recipient shall keep all Confidential Information strictly confidential and shall not, without the prior written consent of the Discloser, disclose or permit disclosure of any Confidential Information to any third party.",
      "(b) Limited Use. The Recipient shall use the Confidential Information solely for the Purpose and for no other purpose.",
      "(c) Care. The Recipient shall take reasonable steps to protect the confidentiality of the Confidential Information, at least equivalent to the care it uses for its own confidential information, but in no event less than a reasonable standard of care.",
      "(d) Permitted Disclosures. The Recipient may disclose Confidential Information only to its employees, agents, or subcontractors who (i) have a need to know such information for the Purpose, and (ii) are bound by confidentiality obligations no less protective than those set forth in this Agreement. The Recipient shall remain fully responsible for any breach of this Agreement by any such persons.",
    ],
  },
  {
    heading: "3. Exclusions",
    lines: [
      "The obligations in Section 2 shall not apply to information that: (a) was known to the Recipient without restriction prior to disclosure by the Discloser; (b) becomes publicly available through no act or omission of the Recipient; (c) is received from a third party without breach of any obligation of confidentiality; or (d) is independently developed by the Recipient without use of or reference to the Confidential Information.",
      "If the Recipient is required by law, regulation, or court order to disclose any Confidential Information, the Recipient shall, to the extent legally permissible, promptly notify the Discloser in writing prior to making any such disclosure and cooperate with the Discloser in seeking a protective order or other appropriate remedy.",
    ],
  },
  {
    heading: "4. Disclaimer",
    lines: [
      'All Confidential Information is provided "AS IS" without any warranties, express or implied, regarding its accuracy.',
    ],
  },
  {
    heading: "5. Ownership and No License",
    lines: [
      "All Confidential Information shall remain the exclusive property of the Discloser. Nothing in this Agreement grants the Recipient any rights, by license or otherwise, to any of the Discloser's intellectual property or Confidential Information, except for the limited right to use such Confidential Information solely for the Purpose.",
    ],
  },
  {
    heading: "6. Term and Duration",
    lines: [
      "This Agreement shall become effective on the Effective Date and remain in effect until terminated by either party upon thirty (30) days' written notice. Notwithstanding any termination, the Recipient's obligation to protect Confidential Information disclosed prior to termination shall survive for a period of five (5) years from the date of disclosure, except that any Confidential Information that qualifies as a trade secret shall be subject to an indefinite confidentiality obligation.",
    ],
  },
  {
    heading: "7. Return or Destruction of Confidential Information",
    lines: [
      "Upon the Discloser's written request, the Recipient shall promptly return or destroy all materials containing Confidential Information, including all copies, notes, or summaries thereof.",
    ],
  },
  {
    heading: "8. Equitable Relief",
    lines: [
      "The Recipient acknowledges that any breach of this Agreement may cause the Discloser irreparable harm for which monetary damages may be inadequate. Accordingly, the Discloser shall be entitled to seek injunctive or other equitable relief to enforce the terms of this Agreement, in addition to any other rights or remedies available at law or in equity.",
    ],
  },
  {
    heading: "9. No Assignment",
    lines: [
      "This Agreement is personal to the Recipient and may not be assigned or transferred, in whole or in part, without the prior written consent of the Discloser.",
    ],
  },
  {
    heading: "10. Governing Law and Jurisdiction",
    lines: [
      "This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles. The Recipient agrees to submit to the exclusive jurisdiction of the state and federal courts located in San Francisco, California for any disputes arising out of or relating to this Agreement.",
    ],
  },
  {
    heading: "11. Entire Agreement",
    lines: [
      "This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior discussions, agreements, or understandings of any kind. No amendment or modification of this Agreement shall be valid unless in writing and signed by both parties. The failure of the Discloser to enforce any provision of this Agreement shall not be construed as a waiver of that provision.",
    ],
  },
];

const dataSubmissionSections: PdfSection[] = [
  {
    heading: "Parties and agreement",
    lines: [
      'This Data Submission and Ownership Agreement ("Agreement") is entered into by and between Cronus Technologies, Inc., d/b/a Trinity-AI, a Delaware corporation with its registered office in the state of Delaware at 251 Little Falls Drive, Wilmington, New Castle County ("Company"), and any individual or entity ("User") submitting data, including but not limited to Google Sheets, Excel models, documents, and other data files, through experts.Trinity-AI.com ("Website" or "Platform").',
      "By submitting data to the Website, User agrees to the following terms:",
    ],
  },
  {
    heading: "1. Ownership and Rights",
    lines: [
      '1.1 By submitting any content, data, files, documents, spreadsheets, financial models or other materials ("Submitted Materials") to the Company through any means, User immediately and irrevocably grants, transfers and assigns to Company all right, title and interest worldwide in and to such Submitted Materials, including all intellectual property rights therein, without any restrictions or limitations whatsoever and without any requirement for additional consideration.',
      "1.2 Company shall have the unrestricted right to use, modify, adapt, reproduce, distribute, publish, display, perform, sell, lease, transmit, or otherwise dispose of the Submitted Materials in any way and for any purpose, commercial or non-commercial, through any means, media, technology or processes, whether currently known or developed in the future.",
      "1.3 User hereby irrevocably waives and agrees not to assert any and all moral rights, rights of attribution, or other similar rights in connection with the Submitted Materials to the fullest extent permitted by law.",
    ],
  },
  {
    heading: "2. Data Handling and Monetization",
    lines: [
      "2.1 Company has complete discretion regarding the handling, storage, use, sale, licensing, distribution, aggregation, analysis, modification, combination, or other exploitation of Submitted Materials, including but not limited to: sale or licensing to third parties; incorporation into products or services; use for marketing, advertising or promotional purposes; analysis and creation of derivative works; combination with other data sources; and any other commercial or non-commercial purpose.",
      "2.2 No Confidentiality or Restrictions. Unless explicitly agreed to in a separate written agreement signed by an authorized Company representative, Company has no confidentiality obligations regarding Submitted Materials and may freely disclose them to any third parties.",
      "2.3 Perpetual Rights. Company's rights to Submitted Materials survive indefinitely regardless of any termination of User's account or relationship with Company.",
    ],
  },
  {
    heading: "3. Compliance and Privacy",
    lines: [
      "3.1 Privacy Laws. For Submitted Materials containing personal information as defined under applicable privacy laws: Company will process such data in accordance with its Privacy Policy and applicable laws; User warrants they have obtained all necessary rights, consents and authorizations for Company's intended uses; User is solely responsible for ensuring their submission complies with all applicable privacy laws; and Company may retain and use data as needed for legal compliance, security, or other legitimate business purposes even if deletion is requested.",
      "3.2 Third Party Data. For any Submitted Materials containing information about third parties: User warrants they have explicit authorization to provide such information; User has informed third parties of Company's intended uses; and User will indemnify Company against any claims from such third parties.",
    ],
  },
  {
    heading: "4. Warranties and Indemnification",
    lines: [
      "4.1 User represents and warrants that: they have all rights needed to grant Company the rights specified herein; Submitted Materials do not violate any laws or third party rights; Submitted Materials are accurate and free from harmful code; their submission and Company's use will not create any liability for Company; and they will not make any claims against Company regarding Submitted Materials.",
      "4.2 User shall defend, indemnify and hold harmless Company and its affiliates, directors, employees and agents from any claims, damages, liabilities, costs or expenses (including attorney fees) arising from: any breach of these terms; Company's use of Submitted Materials; third party claims regarding Submitted Materials; or any misrepresentations regarding Submitted Materials.",
      "4.3 Disclaimer. Company provides no warranties regarding its handling or use of Submitted Materials. User submits materials entirely at their own risk.",
    ],
  },
];

export function legalDocumentTitle(document: LegalDocumentType) {
  return document === "nda"
    ? "Non-Disclosure Agreement"
    : "Data Submission and Ownership Agreement";
}

export function createSignedLegalDocumentPdf(input: SignedLegalDocument) {
  const signedDate = new Date(input.signedAt).toISOString().slice(0, 10);
  const signature = input.signatureText || input.signerName;
  const companyTitle =
    input.document === "nda" ? "Authorized Representative" : "Authorized Signatory";

  return createSimplePdf(
    legalDocumentTitle(input.document),
    [
      ...(input.document === "nda" ? ndaSections : dataSubmissionSections),
      {
        heading: "Electronic signatures",
        lines: [
          "Trinity-AI / Cronus Technologies, Inc.",
          "Signature: Cronus Technologies, Inc.",
          "Name: Legal Operations",
          `Title: ${companyTitle}`,
          `Date: ${signedDate}`,
          "",
          input.document === "nda" ? "Contractor (Recipient)" : "User",
          `Signature: ${signature}`,
          `Name: ${input.signerName}`,
          `Title: ${input.signerTitle || "Not provided"}`,
          `Date: ${signedDate}`,
        ],
      },
    ],
    "Signed electronic copy issued by Trinity-AI.",
  );
}
