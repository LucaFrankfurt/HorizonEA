/**
 * Demo data set for a fictional European logistics group.
 *
 * Technology lifecycle dates follow publicly announced vendor schedules as of
 * late 2026 and are meant as realistic examples – always verify against the
 * vendor's lifecycle page (or https://endoflife.date) before relying on them.
 * Relationships reference entities by name and are resolved by the seeder.
 */
import type {
  ArchitectureState,
  AssetType,
  Criticality,
  Environment,
  HostingModel,
  InitiativeStatus,
  IntegrationPattern,
  InterfaceDirection,
  LifecycleStatus,
  MigrationStrategy,
  PhaseStatus,
  RiskLevel,
  StandardizationStatus,
  TechCategory,
} from "../domain";

export interface SeedTechnology {
  key: string;
  name: string;
  version: string;
  category: TechCategory;
  vendor: string;
  releaseDate?: string;
  eolDate?: string;
  extendedSupportEndDate?: string;
  standardizationStatus: StandardizationStatus;
  notes?: string;
}

const T = (
  key: string,
  name: string,
  version: string,
  category: TechCategory,
  vendor: string,
  standardizationStatus: StandardizationStatus,
  releaseDate?: string,
  eolDate?: string,
  extendedSupportEndDate?: string,
  notes?: string,
): SeedTechnology => ({
  key,
  name,
  version,
  category,
  vendor,
  standardizationStatus,
  releaseDate,
  eolDate,
  extendedSupportEndDate,
  notes,
});

export const seedTechnologies: SeedTechnology[] = [
  // Languages & runtimes
  T("java8", "Java (Oracle JDK)", "8", "Language", "Oracle", "Sunset", "2014-03-18", "2022-03-31", "2030-12-31", "Premier support ended; extended support requires paid subscription."),
  T("java11", "Java (Oracle JDK)", "11", "Language", "Oracle", "Containment", "2018-09-25", "2023-09-30", "2032-01-31"),
  T("java17", "Java (Eclipse Temurin)", "17", "Language", "Eclipse Adoptium", "Approved", "2021-09-14", "2027-10-31"),
  T("java21", "Java (Eclipse Temurin)", "21", "Language", "Eclipse Adoptium", "Approved", "2023-09-19", "2029-12-31", undefined, "Strategic Java LTS for new development."),
  T("netfx461", ".NET Framework", "4.6.1", "Language", "Microsoft", "Prohibited", "2015-11-30", "2022-04-26"),
  T("net6", ".NET", "6", "Language", "Microsoft", "Sunset", "2021-11-08", "2024-11-12"),
  T("net8", ".NET", "8", "Language", "Microsoft", "Containment", "2023-11-14", "2026-11-10"),
  T("net10", ".NET", "10", "Language", "Microsoft", "Approved", "2025-11-11", "2028-11-14", undefined, "Strategic .NET LTS for new development."),
  T("node16", "Node.js", "16", "Language", "OpenJS Foundation", "Prohibited", "2021-04-20", "2023-09-11"),
  T("node20", "Node.js", "20", "Language", "OpenJS Foundation", "Sunset", "2023-04-18", "2026-04-30"),
  T("node22", "Node.js", "22", "Language", "OpenJS Foundation", "Approved", "2024-04-24", "2027-04-30"),
  T("node24", "Node.js", "24", "Language", "OpenJS Foundation", "Approved", "2025-05-06", "2028-04-30"),
  T("py38", "Python", "3.8", "Language", "Python Software Foundation", "Sunset", "2019-10-14", "2024-10-07"),
  T("py312", "Python", "3.12", "Language", "Python Software Foundation", "Approved", "2023-10-02", "2028-10-31"),
  T("php74", "PHP", "7.4", "Language", "The PHP Group", "Prohibited", "2019-11-28", "2022-11-28"),
  T("cobol", "IBM Enterprise COBOL", "6.3", "Language", "IBM", "Containment", undefined, undefined, undefined, "No new development on the mainframe."),

  // Frameworks
  T("sb27", "Spring Boot", "2.7", "Framework", "Broadcom (VMware Tanzu)", "Sunset", "2022-05-19", "2023-11-24"),
  T("sb40", "Spring Boot", "4.0", "Framework", "Broadcom (VMware Tanzu)", "Approved", "2025-11-20", undefined, undefined, "OSS support follows the Spring release cadence; track per minor version."),
  T("angularjs", "AngularJS", "1.8", "Framework", "Google", "Prohibited", "2020-06-04", "2021-12-31"),
  T("angular20", "Angular", "20", "Framework", "Google", "Containment", "2025-05-28", "2026-11-28"),
  T("react19", "React", "19", "Framework", "Meta", "Approved", "2024-12-05"),

  // Databases
  T("ora12", "Oracle Database", "12.2", "Database", "Oracle", "Prohibited", "2017-03-01", "2022-03-31"),
  T("ora19", "Oracle Database", "19c", "Database", "Oracle", "Containment", "2019-04-25", "2029-12-31", "2032-12-31"),
  T("mssql14", "Microsoft SQL Server", "2014", "Database", "Microsoft", "Sunset", "2014-04-01", "2024-07-09", "2027-07-12", "Extended Security Updates purchased until July 2027."),
  T("mssql16", "Microsoft SQL Server", "2016", "Database", "Microsoft", "Sunset", "2016-06-01", "2026-07-14", "2029-07-10"),
  T("mssql22", "Microsoft SQL Server", "2022", "Database", "Microsoft", "Approved", "2022-11-16", "2033-01-11"),
  T("pg11", "PostgreSQL", "11", "Database", "PostgreSQL Global Development Group", "Prohibited", "2018-10-18", "2023-11-09"),
  T("pg13", "PostgreSQL", "13", "Database", "PostgreSQL Global Development Group", "Sunset", "2020-09-24", "2025-11-13"),
  T("pg17", "PostgreSQL", "17", "Database", "PostgreSQL Global Development Group", "Approved", "2024-09-26", "2029-11-08"),
  T("mongo44", "MongoDB", "4.4", "Database", "MongoDB Inc.", "Prohibited", "2020-07-30", "2024-02-29"),
  T("es717", "Elasticsearch", "7.17", "Database", "Elastic", "Sunset", "2022-02-01", "2026-01-15"),

  // Operating systems
  T("win2012", "Windows Server", "2012 R2", "Operating System", "Microsoft", "Prohibited", "2013-11-25", "2023-10-10", "2026-10-13"),
  T("win2016", "Windows Server", "2016", "Operating System", "Microsoft", "Sunset", "2016-10-15", "2027-01-12"),
  T("win2022", "Windows Server", "2022", "Operating System", "Microsoft", "Approved", "2021-08-18", "2031-10-14"),
  T("rhel7", "Red Hat Enterprise Linux", "7", "Operating System", "Red Hat", "Sunset", "2014-06-10", "2024-06-30", "2028-06-30", "Extended Life-cycle Support (ELS) add-on."),
  T("rhel9", "Red Hat Enterprise Linux", "9", "Operating System", "Red Hat", "Approved", "2022-05-17", "2032-05-31"),
  T("centos7", "CentOS Linux", "7", "Operating System", "CentOS Project", "Prohibited", "2014-07-07", "2024-06-30"),
  T("ubuntu2004", "Ubuntu LTS", "20.04", "Operating System", "Canonical", "Sunset", "2020-04-23", "2025-05-31", "2030-04-30", "Expanded Security Maintenance (ESM)."),
  T("ubuntu2404", "Ubuntu LTS", "24.04", "Operating System", "Canonical", "Approved", "2024-04-25", "2029-05-31", "2034-04-30"),
  T("zos25", "IBM z/OS", "2.5", "Operating System", "IBM", "Sunset", "2021-09-30", "2026-09-30"),

  // Middleware
  T("biztalk2016", "Microsoft BizTalk Server", "2016", "Middleware", "Microsoft", "Sunset", "2016-12-01", "2027-01-11"),
  T("tomcat85", "Apache Tomcat", "8.5", "Middleware", "Apache Software Foundation", "Prohibited", "2016-03-17", "2024-03-31"),
  T("tomcat101", "Apache Tomcat", "10.1", "Middleware", "Apache Software Foundation", "Approved", "2022-09-23"),
  T("kafka", "Apache Kafka", "3.9", "Middleware", "Apache Software Foundation", "Approved", "2024-11-06"),
  T("netweaver75", "SAP NetWeaver", "7.5", "Middleware", "SAP", "Containment", "2015-10-20", "2027-12-31", "2030-12-31"),
  T("weblogic12", "Oracle WebLogic Server", "12c", "Middleware", "Oracle", "Containment"),
  T("kong", "Kong Gateway", "3.x", "Middleware", "Kong Inc.", "Approved"),

  // Infrastructure
  T("vsphere7", "VMware vSphere", "7.0", "Infrastructure", "Broadcom", "Sunset", "2020-04-02", "2025-10-02"),
  T("vsphere8", "VMware vSphere", "8.0", "Infrastructure", "Broadcom", "Approved", "2022-10-11", "2027-10-11"),
  T("k8s134", "Kubernetes", "1.34", "Infrastructure", "CNCF", "Containment", "2025-08-27", "2026-10-27", "2027-10-27", "Upstream EOL reached; covered by Amazon EKS extended support."),
  T("k8s135", "Kubernetes", "1.35", "Infrastructure", "CNCF", "Approved", "2025-12-17", "2027-02-28"),
];

export interface SeedAsset {
  name: string;
  assetType: AssetType;
  environment: Environment;
  location: string;
  os?: string; // technology key
  owner: string;
  eolDate?: string;
  description?: string;
}

export const seedAssets: SeedAsset[] = [
  { name: "FRA1-ESX-CL01", assetType: "Cluster", environment: "Prod", location: "Frankfurt DC1", os: "vsphere7", owner: "Infrastructure Operations", eolDate: "2026-12-31", description: "VMware cluster hosting legacy Windows and Linux workloads." },
  { name: "FRA1-SAP-APP01", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "rhel7", owner: "SAP Basis Team", eolDate: "2027-12-31", description: "SAP ECC application server." },
  { name: "FRA1-SAP-DB01", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "rhel7", owner: "SAP Basis Team", eolDate: "2027-12-31", description: "SAP ECC database server (Oracle)." },
  { name: "FRA1-ORA-RAC01", assetType: "Cluster", environment: "Prod", location: "Frankfurt DC1", os: "rhel7", owner: "Database Services", eolDate: "2027-06-30", description: "Shared Oracle RAC cluster." },
  { name: "FRA1-WIN-APP03", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "win2012", owner: "Infrastructure Operations", eolDate: "2025-03-31", description: "Physical server; hardware support expired." },
  { name: "FRA1-WIN-APP05", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "win2016", owner: "Infrastructure Operations", eolDate: "2027-05-31" },
  { name: "FRA1-WIN-APP07", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "win2022", owner: "Infrastructure Operations", eolDate: "2030-06-30", description: "Remediation target host for Windows workloads." },
  { name: "FRA1-WIN-SQL02", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "win2016", owner: "Database Services", eolDate: "2027-09-30", description: "Shared SQL Server 2016 instance." },
  { name: "FRA1-BTS-01", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "win2016", owner: "Integration Team", eolDate: "2027-03-31", description: "BizTalk Server group node." },
  { name: "FRA1-ZMF-01", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "zos25", owner: "Mainframe Services", eolDate: "2028-12-31", description: "IBM z15 mainframe (outsourced operations)." },
  { name: "FRA1-DMZ-WEB01", assetType: "Server", environment: "Prod", location: "Frankfurt DC1 (DMZ)", os: "centos7", owner: "Infrastructure Operations", eolDate: "2026-02-28", description: "Internet-facing web server." },
  { name: "FRA1-UBU-APP11", assetType: "Server", environment: "Prod", location: "Frankfurt DC1", os: "ubuntu2004", owner: "Infrastructure Operations", eolDate: "2028-06-30" },
  { name: "FRA1-FW-CORE01", assetType: "Network Device", environment: "Prod", location: "Frankfurt DC1", owner: "Network Services", eolDate: "2026-03-31", description: "Core firewall pair – vendor end of support reached." },
  { name: "FRA1-NETAPP-01", assetType: "Storage", environment: "Prod", location: "Frankfurt DC1", owner: "Storage Services", eolDate: "2027-04-30", description: "Primary NAS / SAN array." },
  { name: "MUC2-DR-CL01", assetType: "Cluster", environment: "Prod", location: "Munich DC2 (Disaster Recovery)", os: "vsphere8", owner: "Infrastructure Operations", eolDate: "2029-12-31" },
  { name: "aws-prod-eu-central-1", assetType: "Cloud Account", environment: "Prod", location: "AWS eu-central-1 (Frankfurt)", owner: "Cloud Platform Team", description: "Production landing zone account." },
  { name: "aws-nonprod-eu-central-1", assetType: "Cloud Account", environment: "Staging", location: "AWS eu-central-1 (Frankfurt)", owner: "Cloud Platform Team" },
  { name: "azure-prod-westeurope", assetType: "Cloud Account", environment: "Prod", location: "Azure West Europe", owner: "Cloud Platform Team", description: "Hosts RISE with SAP (managed by SAP)." },
  { name: "EKS-PROD-01", assetType: "Cluster", environment: "Prod", location: "AWS eu-central-1 (Frankfurt)", os: "k8s134", owner: "Cloud Platform Team" },
  { name: "EKS-PROD-02", assetType: "Cluster", environment: "Prod", location: "AWS eu-central-1 (Frankfurt)", os: "k8s135", owner: "Cloud Platform Team", description: "New production cluster (target platform)." },
  { name: "EKS-DEV-01", assetType: "Cluster", environment: "Dev", location: "AWS eu-central-1 (Frankfurt)", os: "k8s135", owner: "Cloud Platform Team" },
];

export interface SeedApplication {
  name: string;
  description: string;
  businessDomain: string;
  criticality: Criticality;
  owner: string;
  lifecycleStatus: LifecycleStatus;
  architectureState: ArchitectureState;
  goLiveDate?: string;
  plannedEolDate?: string;
  hostingModel: HostingModel;
  tech?: [string, string][]; // [technology key, usage]
  assets?: [string, string][]; // [asset name, role]
}

export const seedApplications: SeedApplication[] = [
  // Sales & CRM / Customer Service
  { name: "Siebel CRM", description: "Legacy CRM for B2B key accounts: accounts, opportunities, quotes and contracts.", businessDomain: "Sales & CRM", criticality: "Tier 1", owner: "Sales Applications Team", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "2009-04-01", plannedEolDate: "2027-09-30", hostingModel: "On-Premises", tech: [["ora12", "Primary database"], ["java8", "Application runtime"], ["weblogic12", "Application server"]], assets: [["FRA1-ORA-RAC01", "Database"], ["FRA1-ESX-CL01", "Application tier"]] },
  { name: "Salesforce Sales Cloud", description: "Target CRM for account, opportunity and quote management.", businessDomain: "Sales & CRM", criticality: "Tier 1", owner: "Sales Applications Team", lifecycleStatus: "Planned", architectureState: "To-Be", goLiveDate: "2027-04-01", hostingModel: "SaaS" },
  { name: "Salesforce Service Cloud", description: "Target case management and customer 360 for service agents.", businessDomain: "Customer Service", criticality: "Tier 2", owner: "Customer Service IT", lifecycleStatus: "Planned", architectureState: "To-Be", goLiveDate: "2027-07-01", hostingModel: "SaaS" },
  { name: "Customer Service Hub", description: "In-house case management tool for the customer service centre.", businessDomain: "Customer Service", criticality: "Tier 2", owner: "Customer Service IT", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "2019-02-01", plannedEolDate: "2027-09-30", hostingModel: "On-Premises", tech: [["net6", "Application runtime"], ["mssql16", "Database"]], assets: [["FRA1-WIN-APP05", "Application server"], ["FRA1-WIN-SQL02", "Database"]] },

  // Finance & Controlling
  { name: "SAP ECC 6.0", description: "Core ERP: finance, controlling, procurement and order-to-cash.", businessDomain: "Finance & Controlling", criticality: "Tier 1", owner: "SAP Competence Center", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "2008-01-01", plannedEolDate: "2027-12-31", hostingModel: "On-Premises", tech: [["netweaver75", "Application platform"], ["ora19", "Database"]], assets: [["FRA1-SAP-APP01", "Application server"], ["FRA1-SAP-DB01", "Database server"]] },
  { name: "SAP S/4HANA Cloud", description: "Target ERP (RISE with SAP, private cloud edition).", businessDomain: "Finance & Controlling", criticality: "Tier 1", owner: "SAP Competence Center", lifecycleStatus: "Planned", architectureState: "To-Be", goLiveDate: "2027-10-01", hostingModel: "Cloud", assets: [["azure-prod-westeurope", "Managed by SAP"]] },
  { name: "Billing & Invoicing", description: "Freight rating, billing runs and invoice generation.", businessDomain: "Finance & Controlling", criticality: "Tier 1", owner: "Finance IT", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2014-06-01", hostingModel: "On-Premises", tech: [["java11", "Application runtime"], ["sb27", "Application framework"], ["ora19", "Database"]], assets: [["FRA1-ESX-CL01", "Application tier"], ["FRA1-ORA-RAC01", "Database"]] },
  { name: "Treasury Management", description: "Cash management, bank connectivity and payment factory (SaaS).", businessDomain: "Finance & Controlling", criticality: "Tier 2", owner: "Treasury IT", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2020-01-15", hostingModel: "SaaS" },

  // Supply Chain & Logistics
  { name: "FreightMaster TMS", description: "Mainframe transport management: shipment planning, carrier tendering and freight orders (COBOL/CICS).", businessDomain: "Supply Chain & Logistics", criticality: "Tier 1", owner: "Logistics IT", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "1998-10-01", plannedEolDate: "2028-03-31", hostingModel: "On-Premises", tech: [["cobol", "Business logic"], ["zos25", "Operating system"]], assets: [["FRA1-ZMF-01", "Mainframe LPAR"]] },
  { name: "TransportHub", description: "Cloud-native transport management platform built as event-driven microservices.", businessDomain: "Supply Chain & Logistics", criticality: "Tier 1", owner: "Logistics IT", lifecycleStatus: "Planned", architectureState: "To-Be", goLiveDate: "2027-11-01", hostingModel: "Cloud", tech: [["java21", "Service runtime"], ["sb40", "Service framework"], ["pg17", "Database"], ["kafka", "Event backbone"], ["k8s135", "Container platform"]], assets: [["EKS-PROD-02", "Production cluster"], ["EKS-DEV-01", "Development cluster"]] },
  { name: "Warehouse Management System", description: "Warehouse operations: inbound, putaway, picking, packing and stock control.", businessDomain: "Supply Chain & Logistics", criticality: "Tier 1", owner: "Logistics IT", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2017-05-01", hostingModel: "On-Premises", tech: [["net8", "Application runtime"], ["mssql16", "Database"]], assets: [["FRA1-WIN-APP05", "Application server"], ["FRA1-WIN-SQL02", "Database"]] },
  { name: "Fleet Management", description: "Vehicle tracking, maintenance planning and telematics.", businessDomain: "Supply Chain & Logistics", criticality: "Tier 2", owner: "Logistics IT", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2021-03-01", hostingModel: "Cloud", tech: [["py38", "Service runtime"], ["pg13", "Database"], ["k8s134", "Container platform"]], assets: [["EKS-PROD-01", "Production cluster"]] },
  { name: "Route Optimization Engine", description: "Dynamic route planning based on orders, traffic and fleet capacity.", businessDomain: "Supply Chain & Logistics", criticality: "Tier 2", owner: "Logistics IT", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2023-09-01", hostingModel: "Cloud", tech: [["py312", "Optimisation services"], ["k8s134", "Container platform"]], assets: [["EKS-PROD-01", "Production cluster"]] },
  { name: "Supplier Portal", description: "Carrier & supplier self-service for tenders, purchase orders and invoices.", businessDomain: "Supply Chain & Logistics", criticality: "Tier 2", owner: "Procurement IT", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2016-08-01", hostingModel: "Hybrid", tech: [["java17", "Application runtime"], ["tomcat85", "Servlet container"], ["pg13", "Database"]], assets: [["FRA1-UBU-APP11", "Application server"]] },

  // Digital Channels
  { name: "Customer Portal", description: "B2B customer self-service: bookings, quotes, documents and invoices.", businessDomain: "Digital Channels", criticality: "Tier 1", owner: "Digital Team", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2020-11-01", hostingModel: "Cloud", tech: [["node20", "Backend for frontend"], ["react19", "Web frontend"], ["pg17", "Database"]], assets: [["EKS-PROD-01", "Production cluster"]] },
  { name: "Track & Trace Portal", description: "Public shipment tracking website.", businessDomain: "Digital Channels", criticality: "Tier 2", owner: "Digital Team", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "2013-05-01", plannedEolDate: "2027-03-31", hostingModel: "On-Premises", tech: [["angularjs", "Web frontend"], ["php74", "Backend"], ["mongo44", "Tracking cache"]], assets: [["FRA1-DMZ-WEB01", "Web server"]] },
  { name: "Mobile Driver App", description: "Driver app for proof of delivery, barcode scanning and route guidance.", businessDomain: "Digital Channels", criticality: "Tier 2", owner: "Digital Team", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2022-02-01", hostingModel: "Cloud", tech: [["node22", "Backend for frontend"], ["react19", "Mobile UI (React Native)"]], assets: [["EKS-PROD-01", "Production cluster"]] },
  { name: "Corporate Website", description: "Marketing website, newsroom and careers portal.", businessDomain: "Digital Channels", criticality: "Tier 3", owner: "Marketing", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2019-09-01", hostingModel: "Cloud", tech: [["node22", "Rendering"], ["react19", "Frontend"]], assets: [["aws-prod-eu-central-1", "Static hosting & CDN"]] },

  // Human Resources
  { name: "PeopleSoft HCM", description: "HR core: employee records, organisation management and time.", businessDomain: "Human Resources", criticality: "Tier 2", owner: "HR IT", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "2011-01-01", plannedEolDate: "2027-12-31", hostingModel: "On-Premises", tech: [["ora19", "Database"], ["weblogic12", "Application server"], ["java8", "Application runtime"]], assets: [["FRA1-ORA-RAC01", "Database"], ["FRA1-ESX-CL01", "Application tier"]] },
  { name: "Payroll Engine", description: "In-house payroll calculation for German and Austrian entities.", businessDomain: "Human Resources", criticality: "Tier 1", owner: "HR IT", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "2012-01-01", plannedEolDate: "2026-06-30", hostingModel: "On-Premises", tech: [["netfx461", "Application runtime"], ["mssql14", "Database"]], assets: [["FRA1-WIN-APP03", "Application & database server"]] },
  { name: "Workday HCM", description: "Target HR core, payroll and talent management (SaaS).", businessDomain: "Human Resources", criticality: "Tier 2", owner: "HR IT", lifecycleStatus: "Planned", architectureState: "To-Be", goLiveDate: "2027-12-01", hostingModel: "SaaS" },

  // Data & Analytics
  { name: "Enterprise Data Warehouse", description: "Central reporting data warehouse (SQL Server + SSIS).", businessDomain: "Data & Analytics", criticality: "Tier 2", owner: "Data & Analytics Team", lifecycleStatus: "Active", architectureState: "As-Is", goLiveDate: "2012-09-01", plannedEolDate: "2028-03-31", hostingModel: "On-Premises", tech: [["mssql16", "Data warehouse database"]], assets: [["FRA1-WIN-SQL02", "Database"]] },
  { name: "Lakehouse Analytics Platform", description: "Cloud lakehouse for analytics, machine learning and self-service BI.", businessDomain: "Data & Analytics", criticality: "Tier 2", owner: "Data & Analytics Team", lifecycleStatus: "Planned", architectureState: "To-Be", goLiveDate: "2028-01-01", hostingModel: "Cloud", tech: [["py312", "Data pipelines"], ["k8s135", "Compute platform"]], assets: [["aws-prod-eu-central-1", "Data lake storage"], ["EKS-PROD-02", "Compute"]] },
  { name: "Power BI", description: "Self-service reporting and management dashboards.", businessDomain: "Data & Analytics", criticality: "Tier 3", owner: "Data & Analytics Team", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2019-03-01", hostingModel: "SaaS" },

  // Integration & Platform
  { name: "Integration Hub (BizTalk)", description: "Central ESB for EDI, IDoc and file-based integrations.", businessDomain: "Integration & Platform", criticality: "Tier 1", owner: "Integration Team", lifecycleStatus: "Phase-Out", architectureState: "As-Is", goLiveDate: "2017-03-01", plannedEolDate: "2027-06-30", hostingModel: "On-Premises", tech: [["biztalk2016", "Integration engine"], ["mssql16", "Message box database"], ["netfx461", "Custom adapters"]], assets: [["FRA1-BTS-01", "BizTalk node"], ["FRA1-WIN-SQL02", "Message box"]] },
  { name: "Event Streaming Platform", description: "Kafka-based event backbone for real-time, decoupled integration.", businessDomain: "Integration & Platform", criticality: "Tier 1", owner: "Integration Team", lifecycleStatus: "Planned", architectureState: "To-Be", goLiveDate: "2027-03-01", hostingModel: "Cloud", tech: [["kafka", "Event broker"], ["k8s135", "Container platform"]], assets: [["EKS-PROD-02", "Production cluster"]] },
  { name: "API Gateway", description: "Central API management, security policies and rate limiting.", businessDomain: "Integration & Platform", criticality: "Tier 1", owner: "Cloud Platform Team", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2021-06-01", hostingModel: "Cloud", tech: [["kong", "API gateway"], ["k8s134", "Container platform"]], assets: [["EKS-PROD-01", "Production cluster"]] },
  { name: "Identity Provider", description: "Workforce and partner identity, single sign-on and MFA (Microsoft Entra ID).", businessDomain: "Integration & Platform", criticality: "Tier 1", owner: "Security Team", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2018-01-01", hostingModel: "SaaS" },
  { name: "ServiceNow ITSM", description: "IT service management, CMDB and change management.", businessDomain: "Integration & Platform", criticality: "Tier 2", owner: "IT Service Management", lifecycleStatus: "Active", architectureState: "Both", goLiveDate: "2019-01-01", hostingModel: "SaaS" },

  // Corporate Services
  { name: "Legacy Intranet", description: "SharePoint 2010 intranet – retired in 2025, content moved to Microsoft 365.", businessDomain: "Corporate Services", criticality: "Tier 3", owner: "Corporate Communications", lifecycleStatus: "Retired", architectureState: "As-Is", goLiveDate: "2011-06-01", plannedEolDate: "2025-06-30", hostingModel: "On-Premises" },
];

export interface SeedInterface {
  name: string;
  source: string;
  target: string;
  dataFlow: string;
  protocol: string;
  integrationPattern: IntegrationPattern;
  direction?: InterfaceDirection;
  architectureState: ArchitectureState;
}

const I = (
  name: string,
  source: string,
  target: string,
  dataFlow: string,
  protocol: string,
  integrationPattern: IntegrationPattern,
  architectureState: ArchitectureState,
  direction: InterfaceDirection = "Unidirectional",
): SeedInterface => ({ name, source, target, dataFlow, protocol, integrationPattern, architectureState, direction });

export const seedInterfaces: SeedInterface[] = [
  // Current state
  I("Customer master sync", "Siebel CRM", "SAP ECC 6.0", "Accounts, contacts, credit limits", "SOAP/HTTPS", "Synchronous API", "As-Is", "Bidirectional"),
  I("Sales orders (IDoc)", "SAP ECC 6.0", "Integration Hub (BizTalk)", "Sales orders, deliveries", "IDoc / RFC", "Asynchronous Messaging", "As-Is"),
  I("Freight orders", "Integration Hub (BizTalk)", "FreightMaster TMS", "Transport orders", "IBM MQ", "Asynchronous Messaging", "As-Is"),
  I("Shipment status file", "FreightMaster TMS", "Track & Trace Portal", "Shipment milestones", "SFTP (CSV, every 15 min)", "File Transfer", "As-Is"),
  I("Stock levels", "Warehouse Management System", "Integration Hub (BizTalk)", "Goods receipts, stock levels", "File share (XML)", "File Transfer", "As-Is"),
  I("Inventory postings", "Integration Hub (BizTalk)", "SAP ECC 6.0", "Goods movements", "IDoc", "Asynchronous Messaging", "As-Is"),
  I("Payroll journal", "Payroll Engine", "SAP ECC 6.0", "Payroll GL postings", "SFTP (CSV)", "File Transfer", "As-Is"),
  I("Employee master", "PeopleSoft HCM", "Payroll Engine", "Employee master data, absences", "Oracle DB link", "Database Integration", "As-Is"),
  I("Joiner/Mover/Leaver feed", "PeopleSoft HCM", "Identity Provider", "Identity lifecycle events", "CSV via SFTP", "File Transfer", "As-Is"),
  I("Finance actuals", "SAP ECC 6.0", "Enterprise Data Warehouse", "GL actuals, cost centres", "SSIS / ODBC", "ETL / Batch", "As-Is"),
  I("Pipeline extract", "Siebel CRM", "Enterprise Data Warehouse", "Opportunities, quotes", "SSIS / ODBC", "ETL / Batch", "As-Is"),
  I("AR postings", "Billing & Invoicing", "SAP ECC 6.0", "Invoices, AR open items", "SOAP/HTTPS", "Synchronous API", "As-Is"),
  I("Customer 360 lookup", "Customer Service Hub", "Siebel CRM", "Account and contract details", "SOAP/HTTPS", "Synchronous API", "As-Is"),
  I("Reporting datasets", "Enterprise Data Warehouse", "Power BI", "Curated reporting marts", "DirectQuery (TDS)", "Database Integration", "As-Is"),
  I("Bank statements & payments", "Treasury Management", "SAP ECC 6.0", "Payment files, bank statements", "SFTP (camt.053 / pain.001)", "File Transfer", "As-Is", "Bidirectional"),
  I("Carrier invoices (EDI)", "Supplier Portal", "Integration Hub (BizTalk)", "Carrier invoices", "AS2 / EDIFACT", "File Transfer", "As-Is"),
  I("Fleet positions batch", "Fleet Management", "FreightMaster TMS", "Vehicle positions, ETAs", "SFTP batch (hourly)", "File Transfer", "As-Is"),
  I("Intranet news feed", "Legacy Intranet", "Corporate Website", "Press releases", "RSS", "Synchronous API", "As-Is"),

  // Unchanged in both states
  I("Customer APIs", "Customer Portal", "API Gateway", "Bookings, quotes, documents", "REST/HTTPS", "Synchronous API", "Both"),
  I("Invoice API", "API Gateway", "Billing & Invoicing", "Invoices, credit notes", "REST/HTTPS", "Synchronous API", "Both"),
  I("Driver APIs", "Mobile Driver App", "API Gateway", "Proof of delivery, scans", "REST/HTTPS", "Synchronous API", "Both"),
  I("Fleet APIs", "API Gateway", "Fleet Management", "Vehicle status", "REST/HTTPS", "Synchronous API", "Both"),
  I("Route plans", "Route Optimization Engine", "Fleet Management", "Optimised routes", "gRPC", "Synchronous API", "Both"),
  I("Workforce SSO", "Identity Provider", "ServiceNow ITSM", "SAML assertions", "SAML 2.0", "Synchronous API", "Both"),
  I("Customer SSO", "Identity Provider", "Customer Portal", "OIDC tokens", "OpenID Connect", "Synchronous API", "Both"),

  // Target state
  I("Customer & order events", "Salesforce Sales Cloud", "Event Streaming Platform", "Accounts, orders", "Kafka (Avro)", "Event Streaming", "To-Be"),
  I("Order events to ERP", "Event Streaming Platform", "SAP S/4HANA Cloud", "Sales orders", "Kafka Connect / OData", "Event Streaming", "To-Be"),
  I("Financial events", "SAP S/4HANA Cloud", "Event Streaming Platform", "Credit status, invoices", "SAP Event Mesh → Kafka", "Event Streaming", "To-Be"),
  I("Shipment orders", "Event Streaming Platform", "TransportHub", "Transport orders", "Kafka (Avro)", "Event Streaming", "To-Be"),
  I("Shipment status events", "TransportHub", "Event Streaming Platform", "Shipment milestones", "Kafka (Avro)", "Event Streaming", "To-Be"),
  I("Live tracking updates", "Event Streaming Platform", "Customer Portal", "Live tracking", "Kafka → WebSocket", "Event Streaming", "To-Be"),
  I("Inventory events", "Warehouse Management System", "Event Streaming Platform", "Stock movements", "Kafka (Avro)", "Event Streaming", "To-Be"),
  I("Fleet telemetry events", "Fleet Management", "Event Streaming Platform", "Vehicle positions, ETAs", "Kafka (Avro)", "Event Streaming", "To-Be"),
  I("Identity provisioning", "Workday HCM", "Identity Provider", "Joiner/mover/leaver", "SCIM 2.0", "Synchronous API", "To-Be"),
  I("Payroll postings", "Workday HCM", "SAP S/4HANA Cloud", "Payroll GL postings", "Workday Studio / SFTP", "File Transfer", "To-Be"),
  I("Finance data products", "SAP S/4HANA Cloud", "Lakehouse Analytics Platform", "Finance data", "SAP Datasphere replication", "ETL / Batch", "To-Be"),
  I("CRM data products", "Salesforce Sales Cloud", "Lakehouse Analytics Platform", "Pipeline, accounts", "Change data capture", "ETL / Batch", "To-Be"),
  I("Semantic models", "Lakehouse Analytics Platform", "Power BI", "Gold-layer datasets", "SQL endpoint", "Database Integration", "To-Be"),
  I("Customer 360", "Salesforce Service Cloud", "Salesforce Sales Cloud", "Accounts, cases", "Salesforce platform", "Synchronous API", "To-Be", "Bidirectional"),
  I("AR postings (S/4)", "Billing & Invoicing", "SAP S/4HANA Cloud", "Invoices, AR items", "OData/HTTPS", "Synchronous API", "To-Be"),
  I("Bank statements & payments (S/4)", "Treasury Management", "SAP S/4HANA Cloud", "Payment files, bank statements", "SFTP (camt.053 / pain.001)", "File Transfer", "To-Be", "Bidirectional"),
  I("Carrier invoices (API)", "Supplier Portal", "API Gateway", "Carrier invoices", "REST/HTTPS", "Synchronous API", "To-Be"),
];

export interface SeedInitiative {
  name: string;
  description: string;
  strategy: MigrationStrategy;
  status: InitiativeStatus;
  owner: string;
  startDate: string;
  targetDate: string;
  budget: number;
  effortPersonDays: number;
  riskLevel: RiskLevel;
  riskNotes?: string;
  apps?: [string | null, string | null, string?][]; // [source, target, notes]
  techs?: [string | null, string | null, string?][]; // technology keys
  phases: [string, string, string, PhaseStatus][];
}

export const seedInitiatives: SeedInitiative[] = [
  {
    name: "Legacy CRM Replacement",
    description: "Replace Siebel CRM and the in-house Customer Service Hub with Salesforce Sales & Service Cloud.",
    strategy: "Replace",
    status: "In Progress",
    owner: "Head of Sales IT",
    startDate: "2026-02-01",
    targetDate: "2027-09-30",
    budget: 2_400_000,
    effortPersonDays: 3200,
    riskLevel: "High",
    riskNotes: "Complex migration of 15 years of account history. Siebel's Oracle 12.2 database is already out of support. ERP integration depends on the Event Streaming Platform.",
    apps: [["Siebel CRM", "Salesforce Sales Cloud"], ["Customer Service Hub", "Salesforce Service Cloud"]],
    techs: [["ora12", null, "Database decommissioned with Siebel"]],
    phases: [
      ["Discovery & target design", "2026-02-01", "2026-05-31", "Completed"],
      ["Build & data migration", "2026-06-01", "2027-01-31", "In Progress"],
      ["Pilot (DACH key accounts)", "2027-02-01", "2027-04-30", "Planned"],
      ["Rollout & Siebel decommissioning", "2027-05-01", "2027-09-30", "Planned"],
    ],
  },
  {
    name: "S/4HANA Transformation",
    description: "Move from SAP ECC 6.0 to SAP S/4HANA Cloud (RISE, private edition) before the end of mainstream maintenance.",
    strategy: "Replace",
    status: "In Progress",
    owner: "CFO Office / SAP Competence Center",
    startDate: "2025-09-01",
    targetDate: "2027-12-31",
    budget: 8_500_000,
    effortPersonDays: 9800,
    riskLevel: "High",
    riskNotes: "ECC mainstream maintenance ends 31 Dec 2027 – no slack in the plan. 1,800 custom Z-objects to remediate. All ERP interfaces must be re-pointed to the Event Streaming Platform.",
    apps: [["SAP ECC 6.0", "SAP S/4HANA Cloud"]],
    techs: [["netweaver75", null, "Replaced by SAP-managed platform"]],
    phases: [
      ["Prepare & explore", "2025-09-01", "2026-03-31", "Completed"],
      ["Realize (build & test)", "2026-04-01", "2027-06-30", "In Progress"],
      ["Data migration mock loads", "2027-01-01", "2027-08-31", "Planned"],
      ["Cutover & hypercare", "2027-09-01", "2027-12-31", "Planned"],
    ],
  },
  {
    name: "Integration Modernization",
    description: "Replace BizTalk point-to-point integrations with an event-driven Kafka backbone and API-first integration.",
    strategy: "Replace",
    status: "Blocked",
    owner: "Head of Integration",
    startDate: "2026-01-15",
    targetDate: "2027-06-30",
    budget: 1_600_000,
    effortPersonDays: 2100,
    riskLevel: "High",
    riskNotes: "Blocked: Kafka platform security architecture approval pending (CISO review). BizTalk Server 2016 extended support ends 11 Jan 2027.",
    apps: [["Integration Hub (BizTalk)", "Event Streaming Platform"]],
    techs: [["biztalk2016", "kafka"]],
    phases: [
      ["Platform design", "2026-01-15", "2026-04-30", "Completed"],
      ["Security approval", "2026-05-01", "2026-12-31", "In Progress"],
      ["Wave 1 – ERP & TMS flows", "2027-01-01", "2027-04-30", "Planned"],
      ["Wave 2 – EDI & file transfers", "2027-03-01", "2027-06-30", "Planned"],
    ],
  },
  {
    name: "TMS Mainframe Exit",
    description: "Re-architect FreightMaster TMS as the cloud-native TransportHub and exit the mainframe.",
    strategy: "Refactor",
    status: "In Progress",
    owner: "Head of Logistics IT",
    startDate: "2026-04-01",
    targetDate: "2028-03-31",
    budget: 5_200_000,
    effortPersonDays: 7400,
    riskLevel: "High",
    riskNotes: "COBOL knowledge concentrated in three engineers nearing retirement. z/OS 2.5 is out of service since Sep 2026.",
    apps: [["FreightMaster TMS", "TransportHub"]],
    techs: [["cobol", "java21"], ["zos25", "k8s135"]],
    phases: [
      ["Domain decomposition", "2026-04-01", "2026-09-30", "Completed"],
      ["MVP: order capture & tendering", "2026-10-01", "2027-06-30", "In Progress"],
      ["Strangler migration", "2027-07-01", "2028-01-31", "Planned"],
      ["Mainframe decommissioning", "2028-02-01", "2028-03-31", "Planned"],
    ],
  },
  {
    name: "HR & Payroll to Workday",
    description: "Consolidate PeopleSoft HCM and the in-house payroll engine into Workday HCM & Payroll.",
    strategy: "Replace",
    status: "Backlog",
    owner: "CHRO Office",
    startDate: "2027-01-15",
    targetDate: "2027-12-31",
    budget: 1_800_000,
    effortPersonDays: 2600,
    riskLevel: "Medium",
    riskNotes: "Payroll Engine is already past its planned EOL and runs on Windows Server 2012 R2 / .NET Framework 4.6.1 – interim hardening required.",
    apps: [["PeopleSoft HCM", "Workday HCM"], ["Payroll Engine", "Workday HCM"]],
    techs: [["netfx461", null]],
    phases: [
      ["Vendor onboarding", "2027-01-15", "2027-03-31", "Planned"],
      ["Configuration & integrations", "2027-04-01", "2027-08-31", "Planned"],
      ["Parallel payroll runs", "2027-09-01", "2027-11-30", "Planned"],
      ["Go-live", "2027-12-01", "2027-12-31", "Planned"],
    ],
  },
  {
    name: "Data Platform Modernization",
    description: "Migrate the on-premises SQL Server data warehouse to a cloud lakehouse.",
    strategy: "Replatform",
    status: "Backlog",
    owner: "Head of Data & Analytics",
    startDate: "2027-04-01",
    targetDate: "2028-03-31",
    budget: 1_200_000,
    effortPersonDays: 1500,
    riskLevel: "Medium",
    riskNotes: "Report rationalisation required (~600 reports).",
    apps: [["Enterprise Data Warehouse", "Lakehouse Analytics Platform"]],
    techs: [["mssql16", "pg17", "Serving layer"]],
    phases: [
      ["Landing zone & ingestion", "2027-04-01", "2027-08-31", "Planned"],
      ["Report migration", "2027-09-01", "2028-01-31", "Planned"],
      ["Data warehouse shutdown", "2028-02-01", "2028-03-31", "Planned"],
    ],
  },
  {
    name: "Windows Server Remediation",
    description: "Rehost workloads still running on Windows Server 2012 R2 and 2016 onto Windows Server 2022.",
    strategy: "Rehost",
    status: "In Progress",
    owner: "Head of Infrastructure",
    startDate: "2026-06-01",
    targetDate: "2027-01-12",
    budget: 450_000,
    effortPersonDays: 900,
    riskLevel: "Medium",
    riskNotes: "Hard deadline: Windows Server 2016 extended support ends 12 Jan 2027. Payroll Engine is out of scope (retired by HR & Payroll to Workday).",
    apps: [["Warehouse Management System", "Warehouse Management System", "Rehost to FRA1-WIN-APP07"]],
    techs: [["win2012", "win2022"], ["win2016", "win2022"]],
    phases: [
      ["Inventory & assessment", "2026-06-01", "2026-07-31", "Completed"],
      ["Wave 1 – WMS & SQL hosts", "2026-08-01", "2026-11-30", "In Progress"],
      ["Wave 2 – BizTalk & DWH hosts", "2026-12-01", "2027-01-12", "Planned"],
    ],
  },
  {
    name: "Billing Platform Replatforming",
    description: "Containerise Billing & Invoicing on Kubernetes and upgrade to Java 21 / Spring Boot 4.",
    strategy: "Replatform",
    status: "In Progress",
    owner: "Head of Finance IT",
    startDate: "2026-03-01",
    targetDate: "2027-03-31",
    budget: 650_000,
    effortPersonDays: 1100,
    riskLevel: "Low",
    riskNotes: "Spring Boot 2.7 → 4.0 is a major upgrade (Jakarta EE namespace change).",
    apps: [["Billing & Invoicing", "Billing & Invoicing"]],
    techs: [["java11", "java21"], ["sb27", "sb40"]],
    phases: [
      ["Upgrade to Java 21", "2026-03-01", "2026-07-31", "Completed"],
      ["Spring Boot 4 migration", "2026-08-01", "2026-12-31", "In Progress"],
      ["Kubernetes rollout", "2027-01-01", "2027-03-31", "Planned"],
    ],
  },
  {
    name: "Track & Trace Portal Decommissioning",
    description: "Retire the AngularJS/PHP tracking site; tracking moves into the Customer Portal with live events.",
    strategy: "Retire",
    status: "Backlog",
    owner: "Head of Digital",
    startDate: "2026-12-01",
    targetDate: "2027-03-31",
    budget: 120_000,
    effortPersonDays: 220,
    riskLevel: "Medium",
    riskNotes: "Runs on CentOS 7 in the DMZ – security exposure until shutdown. Live tracking depends on the Event Streaming Platform.",
    apps: [["Track & Trace Portal", null, "Functionality consolidated into Customer Portal"]],
    techs: [["angularjs", "react19"], ["php74", null]],
    phases: [
      ["Feature parity in Customer Portal", "2026-12-01", "2027-02-28", "Planned"],
      ["Redirect & shutdown", "2027-03-01", "2027-03-31", "Planned"],
    ],
  },
  {
    name: "Kubernetes 1.35 Upgrade",
    description: "Move workloads from EKS-PROD-01 (1.34) to the new EKS-PROD-02 cluster (1.35).",
    strategy: "Rehost",
    status: "In Progress",
    owner: "Cloud Platform Team",
    startDate: "2026-10-01",
    targetDate: "2027-01-31",
    budget: 90_000,
    effortPersonDays: 160,
    riskLevel: "Low",
    techs: [["k8s134", "k8s135"]],
    phases: [
      ["Cluster build & conformance", "2026-10-01", "2026-11-15", "Completed"],
      ["Workload migration", "2026-11-16", "2027-01-15", "In Progress"],
      ["Decommission EKS-PROD-01", "2027-01-16", "2027-01-31", "Planned"],
    ],
  },
  {
    name: "Fleet Management Runtime Upgrade",
    description: "Upgrade Fleet Management from Python 3.8 / PostgreSQL 13 to supported versions.",
    strategy: "Refactor",
    status: "Backlog",
    owner: "Logistics IT",
    startDate: "2027-01-04",
    targetDate: "2027-04-30",
    budget: 140_000,
    effortPersonDays: 260,
    riskLevel: "Medium",
    riskNotes: "Python 3.8 has been end-of-life since Oct 2024; several telematics libraries need replacement.",
    apps: [["Fleet Management", "Fleet Management"]],
    techs: [["py38", "py312"], ["pg13", "pg17"]],
    phases: [
      ["Dependency upgrade", "2027-01-04", "2027-03-15", "Planned"],
      ["Database upgrade & cut-over", "2027-03-16", "2027-04-30", "Planned"],
    ],
  },
  {
    name: "Corporate Website Cloud Migration",
    description: "Move the corporate website from on-premises hosting to AWS static hosting with CDN.",
    strategy: "Rehost",
    status: "Completed",
    owner: "Marketing",
    startDate: "2025-01-15",
    targetDate: "2025-06-30",
    budget: 80_000,
    effortPersonDays: 140,
    riskLevel: "Low",
    apps: [["Corporate Website", "Corporate Website"]],
    phases: [
      ["Build & content freeze", "2025-01-15", "2025-04-30", "Completed"],
      ["DNS switch & decommissioning", "2025-05-01", "2025-06-30", "Completed"],
    ],
  },
];
