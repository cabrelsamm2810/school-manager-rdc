generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoleName {
  SUPER_ADMIN
  NATIONAL_COORDINATION
  PROVINCIAL_COORDINATION
  PROVINCIAL_AGENT
  SUB_PROVINCIAL_COORDINATION
  SUB_PROVINCIAL_AGENT
  SCHOOL_DIRECTOR
  TEACHER
  PARENT
  STUDENT
}

enum FilePermission {
  PRIVATE
  SCHOOL
  CLASS
  STUDENT
  PARENT
  PUBLIC
}

enum FileCategory {
  PROFILE
  STUDENT
  SCHOOLCHAT
  COMMUNICATION
  DOCUMENT
  SCHOOL
  OTHER
}

model Role {
  id          String   @id @default(cuid())
  name        RoleName @unique
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  users       UserRole[]
}

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  phone         String?
  avatarUrl     String?
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  roles         UserRole[]
  profile       Profile?
  files         File[]
  sentMessages  Message[]     @relation("SentMessages")
  conversations ConversationParticipant[]
}

model UserRole {
  id          String   @id @default(cuid())
  userId      String
  roleId      String
  isPrimary   Boolean  @default(false)
  assignedAt  DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
}

model Profile {
  id          String   @id @default(cuid())
  userId      String   @unique
  bio         String?
  address     String?
  city        String?
  country     String?
  birthDate   DateTime?
  avatarUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Province {
  id              String             @id @default(cuid())
  name            String             @unique
  code            String?
  educationProvinces EducationProvince[]
  schools         School[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model EducationProvince {
  id            String         @id @default(cuid())
  name          String         @unique
  provinceId    String?
  province      Province?      @relation(fields: [provinceId], references: [id])
  subProvinces  SubProvince[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model SubProvince {
  id                  String             @id @default(cuid())
  name                String
  educationProvinceId String
  educationProvince   EducationProvince  @relation(fields: [educationProvinceId], references: [id], onDelete: Cascade)
  schools             School[]
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
}

model School {
  id             String       @id @default(cuid())
  name           String
  code           String?
  provinceId     String?
  province       Province?    @relation(fields: [provinceId], references: [id])
  subProvinceId  String?
  subProvince    SubProvince? @relation(fields: [subProvinceId], references: [id])
  address        String?
  contactEmail   String?
  logoUrl        String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  classes        Class[]
  files          File[]
  documents      Document[]
}

model Student {
  id          String   @id @default(cuid())
  userId      String?  @unique
  schoolId    String?
  classId     String?
  parentId    String?
  studentCode String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Teacher {
  id          String   @id @default(cuid())
  userId      String?  @unique
  schoolId    String?
  classId     String?
  teacherCode String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Parent {
  id          String   @id @default(cuid())
  userId      String?  @unique
  schoolId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Class {
  id         String   @id @default(cuid())
  name       String
  schoolId   String?
  school     School?  @relation(fields: [schoolId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Conversation {
  id          String                    @id @default(cuid())
  title       String?
  isGroup     Boolean                   @default(false)
  createdAt   DateTime                  @default(now())
  updatedAt   DateTime                  @updatedAt
  participants ConversationParticipant[]
  messages    Message[]
}

model ConversationParticipant {
  id            String       @id @default(cuid())
  conversationId String
  userId        String
  joinedAt      DateTime     @default(now())
  conversation  Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  senderId       String
  body           String?
  status         String       @default("sent")
  seenAt         DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  files          MessageFile[]
}

model MessageFile {
  id        String   @id @default(cuid())
  messageId String
  fileId    String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  file      File     @relation(fields: [fileId], references: [id], onDelete: Cascade)
}

model File {
  id           String         @id @default(cuid())
  key          String
  originalName String
  mimeType     String
  size         Int
  ownerId      String?
  owner        User?          @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  schoolId     String?
  school       School?        @relation(fields: [schoolId], references: [id], onDelete: SetNull)
  category     FileCategory   @default(OTHER)
  permissions  FilePermission @default(PRIVATE)
  isDeleted    Boolean        @default(false)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  messageFiles MessageFile[]
}

model Document {
  id          String   @id @default(cuid())
  title       String
  schoolId    String?
  school      School?  @relation(fields: [schoolId], references: [id], onDelete: SetNull)
  fileUrl     String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
