-- SQL script to update the organizations table type column
-- Run this in your MySQL database to add PET_SHOP and PET_HOSTEL to the enum

-- Option 1: If type is an ENUM, alter it to include PET_SHOP and PET_HOSTEL
ALTER TABLE organizations MODIFY COLUMN type ENUM('CLINIC', 'NGO', 'SHELTER', 'PET_SHOP', 'PET_HOSTEL') NOT NULL;

-- Option 2: If the above doesn't work, change to VARCHAR (recommended)
-- ALTER TABLE organizations MODIFY COLUMN type VARCHAR(20) NOT NULL;

