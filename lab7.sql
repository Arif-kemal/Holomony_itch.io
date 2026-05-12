CREATE DATABASE Database_Lab07;

USE DATABASE Lab07;

CREATE TABLE Calisanlar(
ID INT PRIMARY KEY AUTO_INCREMENT,
Name VARCHAR(255),
City VARCHAR(255),
Salary INT
);

CREATE TABLE Musteriler(
ID INT PRIMARY KEY AUTO_INCREMENT,
Name VARCHAR(255),
City VARCHAR(255),
Budget INT
);

INSERT INTO Calisanlar(Name,City,Salary) VALUES
("John","New York",50000),
("Sarah","Los Angeles",55000),
("Michael","Chicago",60000),
("Emily","Houston",48000),
("David","Atlanta",62000);

INSERT INTO Musteriler(Name,City,Budget) VALUES
("Alice","Houston",10000),
("Bob","Dallas",15000),
("Charlie","Boston",12000),
("Diana","Seattle",9000),
("Emily","San Francisco",11000);

SELECT City FROM calisanlar UNION SELECT City FROM musteriler;

SELECT Name FROM calisanlar UNION ALL SELECT Name FROM musteriler;

SELECT MAX(Budget) AS EN_YUKSEK_BUTCE FROM Musteriler;

SELECT MIN(Salary) AS EN_DUSUK_MAAS FROM Calisanlar;

SELECT AVG(Salary) AS ORTALAMA_MAAS FROM Calisanlar;