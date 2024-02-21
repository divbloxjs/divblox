-- create databases
CREATE DATABASE IF NOT EXISTS `dxdatabase`;
CREATE DATABASE IF NOT EXISTS `dxdatabase_2`;

-- create root user and grant rights
CREATE USER 'dxuser'@'localhost' IDENTIFIED BY 'secret';

-- GRANT ALL ON *.* TO 'dxuser'@'localhost';
GRANT ALL ON `dxdatabase`.* TO 'dxuser'@'localhost';
GRANT ALL ON `dxdatabase_2`.* TO 'dxuser'@'localhost';