require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/database');
const User = require('../models/User');
const Module = require('../models/Module');
const Content = require('../models/Content');
const Announcement = require('../models/Announcement');
const ViewLog = require('../models/ViewLog');

const seedDatabase = async () => {
  await connectDB();
  console.log('\n🌱 Starting database seed...');

  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Module.deleteMany({}),
      Content.deleteMany({}),
      Announcement.deleteMany({}),
      ViewLog.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ==================== USERS ====================
    const tutorData = {
      firstName: 'Dr. Sarah',
      lastName: 'Mokoena',
      email: 'tutor@medacademy.com',
      password: 'Tutor1234!',
      role: 'tutor',
      status: 'active',
      phone: '+267 72 000 001',
    };

    const tutor = await User.create(tutorData);
    console.log(`✅ Tutor created: ${tutorData.email} / ${tutorData.password}`);

    // ==================== MODULES ====================
    const moduleData = [
      {
        title: 'Organic Chemistry',
        code: 'CHEM201',
        description: 'Study of carbon-containing compounds, reaction mechanisms, functional groups, and organic synthesis. Covers alkanes, alkenes, alkynes, aromatics, and stereochemistry.',
        icon: 'flask',
        color: '#2563EB',
        isPublished: true,
        instructor: tutor._id,
        sortOrder: 1,
      },
      {
        title: 'Physical Chemistry',
        code: 'CHEM202',
        description: 'Thermodynamics, chemical kinetics, quantum mechanics, and electrochemistry. Includes Gibbs free energy, reaction rates, and spectroscopy fundamentals.',
        icon: 'atom',
        color: '#7C3AED',
        isPublished: true,
        instructor: tutor._id,
        sortOrder: 2,
      },
      {
        title: 'Analytical Chemistry',
        code: 'CHEM203',
        description: 'Quantitative and qualitative analysis techniques including titration, spectroscopy, chromatography, and electroanalytical methods.',
        icon: 'beaker',
        color: '#059669',
        isPublished: true,
        instructor: tutor._id,
        sortOrder: 3,
      },
      {
        title: 'Inorganic Chemistry',
        code: 'CHEM204',
        description: 'Properties and reactions of inorganic compounds, coordination chemistry, transition metals, crystal field theory, and organometallic chemistry.',
        icon: 'grid',
        color: '#DC2626',
        isPublished: true,
        instructor: tutor._id,
        sortOrder: 4,
      },
      {
        title: 'Biochemistry',
        code: 'CHEM301',
        description: 'Molecular biology of life: proteins, enzymes, metabolism, DNA/RNA, and cellular energetics. Bridges chemistry and biological systems.',
        icon: 'dna',
        color: '#D97706',
        isPublished: true,
        instructor: tutor._id,
        sortOrder: 5,
      },
      {
        title: 'Thermodynamics & Kinetics',
        code: 'CHEM205',
        description: 'Advanced treatment of thermodynamic laws, Gibbs energy, equilibrium, chemical kinetics, transition state theory, and catalysis.',
        icon: 'fire',
        color: '#EA580C',
        isPublished: false,
        instructor: tutor._id,
        sortOrder: 6,
      },
    ];

    const modules = await Module.insertMany(moduleData);
    console.log(`✅ ${modules.length} modules created`);

    // ==================== STUDENTS ====================
    const studentsData = [
      { firstName: 'Kagiso', lastName: 'Dlamini', email: 'kagiso@student.com', password: 'Student123!', status: 'active', requestedSubjects: ['Organic Chemistry', 'Biochemistry'] },
      { firstName: 'Boitumelo', lastName: 'Sithole', email: 'boitumelo@student.com', password: 'Student123!', status: 'active', requestedSubjects: ['Physical Chemistry', 'Thermodynamics'] },
      { firstName: 'Tebogo', lastName: 'Nkosi', email: 'tebogo@student.com', password: 'Student123!', status: 'active', requestedSubjects: ['Analytical Chemistry', 'Inorganic Chemistry'] },
      { firstName: 'Naledi', lastName: 'Motsepe', email: 'naledi@student.com', password: 'Student123!', status: 'active', requestedSubjects: ['Organic Chemistry', 'Physical Chemistry'] },
      { firstName: 'Mpho', lastName: 'Kgosidintsi', email: 'mpho@student.com', password: 'Student123!', status: 'active', requestedSubjects: ['Biochemistry', 'Inorganic Chemistry'] },
      { firstName: 'Siyanda', lastName: 'Mahlangu', email: 'siyanda@student.com', password: 'Student123!', status: 'active', requestedSubjects: ['Organic Chemistry'] },
      { firstName: 'Lerato', lastName: 'Phiri', email: 'lerato@student.com', password: 'Student123!', status: 'pending', requestedSubjects: ['Physical Chemistry', 'Analytical Chemistry'] },
      { firstName: 'Otsile', lastName: 'Gaolathe', email: 'otsile@student.com', password: 'Student123!', status: 'pending', requestedSubjects: ['Organic Chemistry', 'Biochemistry'] },
      { firstName: 'Kefilwe', lastName: 'Tau', email: 'kefilwe@student.com', password: 'Student123!', status: 'suspended', requestedSubjects: ['Inorganic Chemistry'] },
      { firstName: 'Dineo', lastName: 'Radebe', email: 'dineo@student.com', password: 'Student123!', status: 'active', requestedSubjects: ['Analytical Chemistry'] },
    ];

    const createdStudents = [];
    for (const s of studentsData) {
      const student = await User.create({ ...s, role: 'student' });
      createdStudents.push(student);
    }
    console.log(`✅ ${createdStudents.length} students created`);

    // Enroll active students in modules
    const activeStudents = createdStudents.filter(s => s.status === 'active');
    const orgChem = modules[0];
    const physChem = modules[1];
    const analChem = modules[2];
    const inorgChem = modules[3];
    const biochem = modules[4];

    const enrollments = [
      { student: activeStudents[0], mods: [orgChem._id, biochem._id] },
      { student: activeStudents[1], mods: [physChem._id, analChem._id] },
      { student: activeStudents[2], mods: [analChem._id, inorgChem._id] },
      { student: activeStudents[3], mods: [orgChem._id, physChem._id] },
      { student: activeStudents[4], mods: [biochem._id, inorgChem._id] },
      { student: activeStudents[5], mods: [orgChem._id] },
      { student: activeStudents[6], mods: [analChem._id] },
    ];

    for (const e of enrollments) {
      await User.findByIdAndUpdate(e.student._id, { enrolledModules: e.mods });
      await Module.updateMany(
        { _id: { $in: e.mods } },
        { $addToSet: { enrolledStudents: e.student._id } }
      );
    }
    console.log(`✅ Students enrolled in modules`);

    // ==================== CONTENT ====================
    // Placeholder PDF URL (will be a mock URL since we're seeding)
    const mockPdfUrl = '/uploads/placeholder.pdf';

    const contentData = [
      // Organic Chemistry
      { title: 'Week 1: Introduction to Organic Chemistry & Carbon Bonding', module: orgChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week1-intro-organic.pdf', fileSize: 2457600, isPublished: true, sortOrder: 1, views: 145 },
      { title: 'Week 2: Alkanes, Alkenes & Alkynes - Nomenclature', module: orgChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week2-hydrocarbons.pdf', fileSize: 3145728, isPublished: true, sortOrder: 2, views: 132 },
      { title: 'Week 3: Reaction Mechanisms - SN1, SN2, E1, E2', module: orgChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week3-mechanisms.pdf', fileSize: 4194304, isPublished: true, sortOrder: 3, views: 98 },
      { title: 'Week 4: Aromatic Chemistry & Benzene Reactions', module: orgChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week4-aromatics.pdf', fileSize: 2621440, isPublished: true, sortOrder: 4, views: 87 },
      { title: 'Week 5: Stereochemistry - Chirality & Enantiomers', module: orgChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week5-stereochemistry.pdf', fileSize: 3670016, isPublished: true, sortOrder: 5, views: 76 },
      { title: 'Organic Chemistry Final Exam 2023', module: orgChem._id, category: 'past_paper', year: 2023, fileUrl: mockPdfUrl, fileName: 'organic-final-2023.pdf', fileSize: 1048576, markingSchemeUrl: mockPdfUrl, isPublished: true, sortOrder: 10, views: 210 },
      { title: 'Organic Chemistry Final Exam 2022', module: orgChem._id, category: 'past_paper', year: 2022, fileUrl: mockPdfUrl, fileName: 'organic-final-2022.pdf', fileSize: 1048576, markingSchemeUrl: mockPdfUrl, isPublished: true, sortOrder: 11, views: 189 },
      { title: 'Organic Chemistry Midterm 2023', module: orgChem._id, category: 'past_paper', year: 2023, fileUrl: mockPdfUrl, fileName: 'organic-midterm-2023.pdf', fileSize: 786432, isPublished: true, sortOrder: 12, views: 165 },

      // Physical Chemistry
      { title: 'Week 1: Thermodynamic Laws - System, Surroundings & State Functions', module: physChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week1-thermodynamics.pdf', fileSize: 2883584, isPublished: true, sortOrder: 1, views: 118 },
      { title: 'Week 2: Gibbs Free Energy & Chemical Equilibrium', module: physChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week2-gibbs.pdf', fileSize: 3407872, isPublished: true, sortOrder: 2, views: 95 },
      { title: 'Week 3: Chemical Kinetics - Rate Laws & Activation Energy', module: physChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week3-kinetics.pdf', fileSize: 2621440, isPublished: true, sortOrder: 3, views: 82 },
      { title: 'Thermodynamics & Kinetics Past Paper 2023', module: physChem._id, category: 'past_paper', year: 2023, fileUrl: mockPdfUrl, fileName: 'physchem-2023.pdf', fileSize: 1048576, markingSchemeUrl: mockPdfUrl, isPublished: true, sortOrder: 10, views: 142 },
      { title: 'Thermodynamics & Kinetics Past Paper 2022', module: physChem._id, category: 'past_paper', year: 2022, fileUrl: mockPdfUrl, fileName: 'physchem-2022.pdf', fileSize: 1048576, isPublished: true, sortOrder: 11, views: 110 },

      // Analytical Chemistry
      { title: 'Week 1: Analytical Methods Overview & Lab Safety', module: analChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week1-analytical-overview.pdf', fileSize: 1572864, isPublished: true, sortOrder: 1, views: 76 },
      { title: 'Week 2: Titrimetric Analysis - Acid-Base & Redox Titrations', module: analChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week2-titrations.pdf', fileSize: 2097152, isPublished: true, sortOrder: 2, views: 65 },
      { title: 'Week 3: Spectroscopic Methods - UV-Vis & IR Spectroscopy', module: analChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week3-spectroscopy.pdf', fileSize: 3145728, isPublished: true, sortOrder: 3, views: 54 },
      { title: 'Lab Report: Standardization of NaOH Solution', module: analChem._id, category: 'lab_report', fileUrl: mockPdfUrl, fileName: 'lab-naoh-standardization.pdf', fileSize: 524288, isPublished: true, sortOrder: 20, views: 88 },
      { title: 'Lab Report: Determination of Vitamin C by Iodimetry', module: analChem._id, category: 'lab_report', fileUrl: mockPdfUrl, fileName: 'lab-vitamin-c.pdf', fileSize: 786432, isPublished: true, sortOrder: 21, views: 72 },

      // Inorganic Chemistry
      { title: 'Week 1: Periodic Table Trends & Atomic Properties', module: inorgChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week1-periodic-trends.pdf', fileSize: 2097152, isPublished: true, sortOrder: 1, views: 55 },
      { title: 'Week 2: Coordination Chemistry & Ligand Field Theory', module: inorgChem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week2-coordination.pdf', fileSize: 3670016, isPublished: true, sortOrder: 2, views: 48 },
      { title: 'Inorganic Chemistry Exam Paper 2023', module: inorgChem._id, category: 'past_paper', year: 2023, fileUrl: mockPdfUrl, fileName: 'inorganic-2023.pdf', fileSize: 1048576, isPublished: true, sortOrder: 10, views: 76 },

      // Biochemistry
      { title: 'Week 1: Amino Acids, Proteins & Enzyme Catalysis', module: biochem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week1-proteins.pdf', fileSize: 3145728, isPublished: true, sortOrder: 1, views: 95 },
      { title: 'Week 2: Carbohydrate Metabolism - Glycolysis & TCA Cycle', module: biochem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week2-metabolism.pdf', fileSize: 4194304, isPublished: true, sortOrder: 2, views: 88 },
      { title: 'Week 3: DNA Replication, Transcription & Translation', module: biochem._id, category: 'notes', fileUrl: mockPdfUrl, fileName: 'week3-molecular-bio.pdf', fileSize: 2621440, isPublished: true, sortOrder: 3, views: 72 },
      { title: 'Biochemistry Final Exam 2023', module: biochem._id, category: 'past_paper', year: 2023, fileUrl: mockPdfUrl, fileName: 'biochem-final-2023.pdf', fileSize: 1048576, markingSchemeUrl: mockPdfUrl, isPublished: true, sortOrder: 10, views: 120 },
    ];

    const insertedContent = await Content.insertMany(
      contentData.map(c => ({ ...c, uploadedBy: tutor._id }))
    );
    console.log(`✅ ${insertedContent.length} content items created`);

    // ==================== ANNOUNCEMENTS ====================
    const announcementData = [
      {
        title: 'Q2 Exam Schedule Now Available - Important Dates',
        body: '<p>Dear Students,</p><p>The Q2 examination schedule has been finalized. Please review the dates carefully and ensure you have downloaded all relevant past papers and study notes from your module pages.</p><p><strong>Organic Chemistry (CHEM201):</strong> 15 June 2024<br><strong>Physical Chemistry (CHEM202):</strong> 17 June 2024<br><strong>Analytical Chemistry (CHEM203):</strong> 19 June 2024</p><p>Good luck with your preparation!</p><p>Dr. Sarah Mokoena</p>',
        scope: 'global',
        status: 'published',
        notifyViaEmail: true,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        author: tutor._id,
        views: 24,
      },
      {
        title: 'New Organic Mechanisms Study Guide Uploaded',
        body: '<p>I have uploaded a comprehensive study guide covering SN1, SN2, E1, and E2 reaction mechanisms. This guide includes worked examples, practice questions, and a comparison table to help you distinguish between the mechanisms.</p><p>Please review Week 3 notes alongside this guide for best results.</p>',
        scope: 'module',
        targetModule: orgChem._id,
        status: 'published',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        author: tutor._id,
        views: 18,
      },
      {
        title: 'Lab Session #3 Rescheduled - New Date: 20 May',
        body: '<p>Due to unforeseen circumstances, the Analytical Chemistry lab session originally scheduled for Friday 17 May has been rescheduled to Monday 20 May at 2:00 PM in Lab Room 4B.</p><p>Please ensure you have completed the pre-lab reading on titrimetric analysis before attending.</p>',
        scope: 'module',
        targetModule: analChem._id,
        status: 'published',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        author: tutor._id,
        views: 12,
      },
      {
        title: 'Welcome to Med Academy - Getting Started Guide',
        body: '<p>Welcome to Med Academy! Here is everything you need to get started:</p><ol><li>Navigate to <strong>My Modules</strong> to access your enrolled chemistry subjects</li><li>Download past papers and study notes from each module page</li><li>Track your study progress on the Dashboard</li><li>Check Announcements regularly for updates from your tutor</li></ol><p>If you have any questions, please contact your tutor directly.</p>',
        scope: 'global',
        status: 'published',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        author: tutor._id,
        views: 42,
      },
      {
        title: 'Mid-term Feedback Survey - Draft',
        body: 'Please take a few minutes to complete the mid-term feedback survey to help us improve the course experience.',
        scope: 'global',
        status: 'draft',
        author: tutor._id,
        views: 0,
      },
    ];

    await Announcement.insertMany(announcementData);
    console.log(`✅ ${announcementData.length} announcements created`);

    // ==================== VIEW LOGS ====================
    // Generate realistic view log data for analytics
    const logEntries = [];
    const allContent = insertedContent;
    const enrolledStudents = activeStudents.slice(0, 7);

    for (let i = 0; i < 200; i++) {
      const student = enrolledStudents[Math.floor(Math.random() * enrolledStudents.length)];
      const content = allContent[Math.floor(Math.random() * allContent.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);

      logEntries.push({
        student: student._id,
        content: content._id,
        module: content.module,
        action: Math.random() > 0.7 ? 'download' : 'view',
        sessionDuration: Math.floor(Math.random() * 1800),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 100) + 1}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await ViewLog.insertMany(logEntries);
    console.log(`✅ ${logEntries.length} view log entries created`);

    // Create a placeholder PDF file
    const uploadsDir = require('path').join(__dirname, '../../uploads');
    if (!require('fs').existsSync(uploadsDir)) {
      require('fs').mkdirSync(uploadsDir, { recursive: true });
    }
    // Write minimal valid PDF
    const minimalPdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF';
    require('fs').writeFileSync(require('path').join(uploadsDir, 'placeholder.pdf'), minimalPdf);

    console.log('\n✅ Database seed complete!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────');
    console.log('🎓 TUTOR:');
    console.log('   Email:    tutor@medacademy.com');
    console.log('   Password: Tutor1234!');
    console.log('\n👨‍🎓 STUDENTS (Active):');
    console.log('   Email:    kagiso@student.com');
    console.log('   Password: Student123!');
    console.log('\n⏳ PENDING STUDENT:');
    console.log('   Email:    lerato@student.com');
    console.log('   Password: Student123!');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
