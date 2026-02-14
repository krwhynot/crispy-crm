-- Grand Rapids Trade Show Campaign - TRANSACTIONAL Import
-- Wrapped in BEGIN/COMMIT for all-or-nothing execution

BEGIN;

-- Set sequence to 10000 to avoid conflicts with seed.sql (which uses IDs 1-1809)
SELECT setval('organizations_id_seq', 10000);
SELECT setval('contacts_id_seq', 10000);


-- Grand Rapids Trade Show Campaign - CORRECTED Import
-- Uses Column [1] 'Notes' as CUSTOMER organization name

-- Step 1: Create CUSTOMER organizations (from Column [1])

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('10 PIN ICE CREAM', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('13TH STREET MARKET', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('231 BAR AND GRILL (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('5 Knives', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('7 MONKS TAPROOM - GRAND RAPIDS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('ACCLAIMED CATERING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('ALPHA CHI OMEGA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('AMWAY GRAND PLAZA HOTEL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('ARTURO''S TACO''S', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Ada House The Post', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Ala Mode Restaurant', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('American House Jenison-Cottonwood M', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Applause Catering & Events', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Apple Mountain', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Asher Creek Creamery and Deli', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Autumn House Williamsburg', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BACK FORTY (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BAIR LAKE BIBLE CAMP', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BARRY CTY COMMISSION ON AGING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BAYMONT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BEAMERS RESTAURANT-SPARTAN WEST BC', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BIG APPLE BAGEL - PORTAGE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BLIND SQUIRREL TAVERN (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BOWENS RESTAURANT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BRICKS GEORGETOWN', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BRIGHTON MARKET', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BRONSON COMMONS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BSA-CAMP ROTARY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BUCKS RUN GOLF CLUB', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('BULLSEYE MARKETPLACE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Back Alley Saloon', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Backroads Tavern', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Barrister Brewing Co', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Beachside Tavern', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Black Bear Golf', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Booher''s Market and Diner', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Booyahs Bar & Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Brown Iron Brewhouse - Washington', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Bud n’ Stanley’s', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Butcher Block Social', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Byron Center Heritage Elementary', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CAFE MAX', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CAMP BLODGETT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CAMP CROSLEY YMCA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CANDIED YAM', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CASCADE TRAILS SENIOR LIVING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CASS COUNTY MEDICAL FACILITY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CATAWBA ISLAND CLUB', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CDS - Kettering University', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CDS-SOUTH HAVEN CONFERENCE CTR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CELEBRATION CINEMA LANSING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CENTER LAKE BIBLE CAMP', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CHATEAU AERONAUTIQUE WINERY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CLEMENTINE''S SALOON', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('COMMUNITY HOSPITAL OF BREMEN-H05464', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CORINE''S CAKES & CATERING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('COURTYARD GRAND RAPIDS DOWNTOWN', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CRAN HILL RANCH', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CRYSTAL VALLEY CATERING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('CULINARY INSTITUTE OF MICHIGAN', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Caddie Cones', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Canary Inn Bar Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Canopy - F&B 152141E', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Carerite- Harbor Post Acute Center', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Champs Bar & Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Cherry Republic- Glen Arbor Public', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Choice Services - Camp Grayling - B', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Cinco De Mayo Allendale', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('City Limits', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Corewell Health Blodgett Hospital N', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Corewell Health Butterworth Hospita', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Corewell Health Greenville Hosp-Nut', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Corewell Health Lakeland Hosp St Jo', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Cornerstone Univ/Food Service - 355', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Crowes Nest Café', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Culvers Muskegon MI Independence Dr', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('D''AGOSTINO''S RESTAURANT/ NAVAJO LOU', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('DECK DOWN UNDER (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('DORR TRUCK STOP/EXIT 76 CORP', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('DUNE DOGZ', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Dale''s Bar & Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Daydreamer Domes', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Dinks & Dingers Social Club', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Docks Landing', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Duck Lake Tavern', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Dupuis', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('EAGLE VILLAGE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('EL JALAPENO TAQUERIA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('ELKHART GENERAL HOSPITAL-H045769', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('EXODUS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('EXPLORERS LEARNING CENTER', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('EXPRESS CAFE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Eaglemonk Pub and Brewery', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('East Kentwood Concessions', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Elk Lake Bar And Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Eudicis Pizza Of Midland', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('FENNVILLE ELEMENTARY SCHOOL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('FIRESIDE CRAFT BURGERS & BREWS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('FLANNIGAN''S GOAT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('FLUSHING VALLEY GOLF COURSE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('FSU - THE ROCK CAFE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Fife Lake Inn', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Food Service - Kitchen YMCA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Freds Of Roscommon', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Freighter''s Eatery and Taproom', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('G R PUBLIC SCHOOLS NUTRITION CTR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('G''S PIZZERIA (KALKASKA)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('G''S SAGINAW', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GLENWOOD (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GRAND OAKS NURSING CENTER', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GREEN ACRES OF LOWELL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GREENVILLE PUBLIC SCHOOLS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GRIFFIN GRILL & PUB', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GRIFFITH PUBLIC SCHOOLS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GS- Peabody Retirement Community', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('GVSU - ARA DCIH Cafe L', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Grace Haven Senior Living', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Gun Lake Casino', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('HALL STREET PARTY STORE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('HI SKORE LANES', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('HOLY FAMILY CATHOLIC PARISH', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('HOUSEMAN''S FOODS WHITE CLOUD', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Harvest Pointe At Thornapple Manor', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Heart & Seoul', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Henrys', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('High Caliber Karting And Entertainm', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Hoffman Street Grocery', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Holly Pub And Grub', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Hope Network Wildwood West AFC', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Hopside Brewery', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Hosel Rockets Golf & Whiskey Lounge', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('INTERLOCHEN CENTER FOR THE ARTS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('IONIA COUNTY COMMISSION ON AGING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Icarus Grilled Chicken', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Ivy Alley', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('JIM''S PIZZA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('JT''S PIZZA & SPIRITS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Jean Toner', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Jeff Kowalczyk', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Jennifer Whitaker', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('KCTC East', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('KJ CATERING COMPANY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Kristi Morris', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Kzoo Station', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LA COCINA MEXICAN GRILL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LAKE SHORE RESORT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LAKEVIEW TERRACE ASSISTED LIVING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LC TAPHOUSE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LFG BAR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LOG CABIN TAVERN', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LOGAN''S IRISH PUB', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LUDINGTON WOODS LIVING CTR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('LUTHERAN LIFE VILLAGES KENDALLVILLE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Lake Dale Ale', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Lake Michigan Camp', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Lakeshore Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Lakeside Cafe', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Leroys Hot Stuff', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Liminal Restaurant & Lounge', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Little Bay Gourmet', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Long Beach Country Club', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Ludington Meat Company', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Lyndsey M Gauthier', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MAIL POUCH SALOON- SWANTON', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MAIN STREET BURGERS, PIZZA & ICE CR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MANCINO''S-JAMES ST-HOLLAND', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MANCINOS - COMMISSARY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MARKET 22', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MARQUETTE COUNTY MEDICAL CARE FACIL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MARTHAS VINEYARD', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MCTI-CULINARY PROGRAM', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MEXO', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MI Vet Homes at Grand Rapids- Kitch', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MICHIGAN YOUTH CHALLENGE ACADEMY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MICHIGN CENTER EAGLES # 3634', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MICHINDOH CONFERENCE CENTER', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MIDLAND CENTER FOR THE ARTS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MONKS BAR & GRILL SUN PRAIRIE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MOOSE LODGE OF CARO', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MORRISON LAKE GOLF CLUB', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MR BURGER #1', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('MSU FOOD STORES PM PALLET DELIVERY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Mangiamos', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Manny''s Dream Kitchen', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Marcus Powers', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Mark''s Diner', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Mega Bev GR29 LLC', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Miles Market', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Milwaukee House  Scoobys Snack Shac', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Mongo General Store', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Montague High School', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Mr.Pibs', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Murphy''s Bar', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Muskegon Country Club', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('NAPOLEON RESTAURANT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('NEDS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('NMC - Hawk Owl Cafe', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('NMU / UC  CATERING FOOD', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('NORTH WOODS NURSING CENTER', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('NORTHCREST ASSISTED LIVING COMMUNIT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('NORTHVIEW PUBLIC SCHOOL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('New Mancinos Big Rapids', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Nicos Pub and Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Northfield Lanes Plainfield', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Northside Senior Center', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Notre Dame-110 South Dining Hall', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Notre Dame-General Acct', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('OAKWOOD RESORT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('OGEMAW COMMISSION ON AGING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('OMH-BROWNING MASONIC COMMUNITY 6452 (100026751)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('ORCHARD CREEK SUPPORTIVE CARE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('OTSEGO CLUB FOOD AND BEVERAGE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('OTTAWA COUNTY SENIOR RESOURCE 20226', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Old Mill Brewpub & Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('PENINSULA GRILL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('PINES VILLAGE RETIREMENT', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('PORTSIDE PIZZA- COLUMBIA CITY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Papa Chops Eatery', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pasadena Villa Great Lakes', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Paw Paw Township Senior Center', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Perennial Park', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Perenso Test', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pig-N-Pizza', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pigeon Hill Brewing Company', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pin Fusion', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pincrest Bar & Lanes', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pine Haven Senior Assisted Living', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pine Rest Christian Mental Health S', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Piper’s Grinders Galore', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Pizza Man', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Porters Smokehouse', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Powers Health - St Mary Med Food Se', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('RAILSIDE LIVING CENTER', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('RDX CREATIVE DINING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('REAL SERVICES/NUTRITION', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('REST HAVEN HOMES', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('RINALDI PIZZA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('RIPPLING RAPIDS GOLF COURSE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('RIVER VALLEY', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('RUSH CREEK BISTRO AT SUNNYBROOK CC', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Railside Golf Club', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Ravenna Pub', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Red Brick Tap & Barrel', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Rehabilitation Hosp Northern IN-H06', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Resthaven - The Farmstead', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Revel Center', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Rip''s', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('River House Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('River Raisin Distillery', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Roasted', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Romulus Community Schools', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Ryan Santellan', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SALT OF THE EARTH', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SANDY PINES SPORTS BAR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SILVER BEACH PIZZA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SLEDERS FAMILY TAVERN', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SNACK SHACK 2 (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SPRINGS (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SPRINGVALE ASSISTED LIVING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('STUDIO C - CELEBRATION CINEMA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('SULLIVAN''S', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Sawd''s Village Inn', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Shanty Creek Resort - Summit Villag', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Shigs in Pit - Maplecrest 3711784E', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Shoeys Log Bar', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Smuggler At North Shore', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Socibowl', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('South Haven Dairy Bar', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Sparrow Hospital', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Sparta Lanes', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('St Ambrose Church', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Stans Bar', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('State Street Dairy', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Street Beet', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Street Fare - LaFortune Student Center', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TERRY''S WOODBURY CAFE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('THIRSTY STURGEON (THE)', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('THORNAPPLE MANOR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('THREE BLONDES BREWING', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('THREE BRIDGES DISTILLERY AND TAPROO', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('THS-SANCTUARY AT MARYCREST MANOR-H0', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('THS-Trinity Grand Haven-H052340', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TIM''S TOO', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TIMBERS BAR & GRILL', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TOP SHELF PIZZA & PUB', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TRACEY''S AT ROAM INN', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TRADEWINDS RESTAURANT MISHAWAKA', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TRILOGY-BATTLE CREEK-OAKS AT NORTHP', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('TWO HATS RANCH', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Tally Ho BBQ', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Taste Buds', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Comedy Project', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Featherbone Restaurant & Lounge', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Finish Line Family Restaurant', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Harrington Inn', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Hotel Frankfort', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Lucky Gnome', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Rubber Duck', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Tavern on 223', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Village At Inverness', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Village at Pine Valley', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Wildflour', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The Wooden Shoe', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The curve cafe', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('The hof bar and grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Time Out Campground', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Toast N Jams', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Trilogy - Harbor Terrace Senior Liv', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Tulip City Sports Bar & Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Turtle Creek Casino & Hotel', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('U OF I- HOUSING FOOD STORES', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('VAL''S FAMOUS PIZZA & GRINDERS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('VILLA MACRI', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('VILLAGE INN PIZZA PARLOR', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Vicinia Independent Living, LLC', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Vickers Lakeside Tavern', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Villa Marine Bar and Grill', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Village Cafe And Pub', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WEST MICHIGAN PROVISIONS', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WEST MICHIGAN WHITECAPS SUITES', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WEST ON WARREN', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WHITE LAKE EAGLES #3214', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WICKED SISTER', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WILLOW RIDGE GOLF CLUB', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WMU-Student Center', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('WOODSIDE BIBLE', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Walts Meat Market', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Wander In', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Whiskey Creek Campground', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('White Horse Saloon', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Woodshed Tap', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Yankee Bills', 'customer', NULL, CURRENT_TIMESTAMP);

INSERT INTO organizations (name, organization_type, created_by, created_at)
VALUES ('Yoders Country Market', 'customer', NULL, CURRENT_TIMESTAMP);


-- Step 2: Create contacts, opportunities, and activities

-- Contact: Dean  Haselton at NMC - Hawk Owl Cafe
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NMC - Hawk Owl Cafe' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dean  Haselton', jsonb_build_array(jsonb_build_object('phone', '(231) 995-1000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NMC - Hawk Owl Cafe' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dean  Haselton @ NMC - Hawk Owl Cafe',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ryan Lomonaco at 10 PIN ICE CREAM
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '10 PIN ICE CREAM' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ryan Lomonaco', jsonb_build_array(jsonb_build_object('phone', '(616) 279-6809', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '10 PIN ICE CREAM' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ryan Lomonaco @ 10 PIN ICE CREAM',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '10 PIN ICE CREAM' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Number not in service', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Brian Eaton at 13TH STREET MARKET
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '13TH STREET MARKET' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brian Eaton', jsonb_build_array(jsonb_build_object('phone', '(231) 775-1207', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '13TH STREET MARKET' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brian Eaton @ 13TH STREET MARKET',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '13TH STREET MARKET' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Number not in service', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Michele Smith at 13TH STREET MARKET
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '13TH STREET MARKET' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Michele Smith', jsonb_build_array(jsonb_build_object('phone', '(231) 775-1207', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '13TH STREET MARKET' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Michele Smith @ 13TH STREET MARKET',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Charlie Maidens at 231 BAR AND GRILL (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '231 BAR AND GRILL (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Charlie Maidens', jsonb_build_array(jsonb_build_object('phone', '(231) 378-0231', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '231 BAR AND GRILL (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Charlie Maidens @ 231 BAR AND GRILL (THE)',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '231 BAR AND GRILL (THE)' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back Friday 10:30', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Rachel  Sund at 5 Knives
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '5 Knives' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Rachel  Sund', jsonb_build_array(jsonb_build_object('phone', '(616) 259-1023', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '5 Knives' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Rachel  Sund @ 5 Knives',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '5 Knives' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back Friday for Rachel', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Steve Schultz at 7 MONKS TAPROOM - GRAND RAPIDS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '7 MONKS TAPROOM - GRAND RAPIDS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Steve Schultz', jsonb_build_array(jsonb_build_object('phone', '(616) 265-5417', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '7 MONKS TAPROOM - GRAND RAPIDS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Steve Schultz @ 7 MONKS TAPROOM - GRAND RAPIDS',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '7 MONKS TAPROOM - GRAND RAPIDS' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back after 3:00', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Steve Schultz at 7 MONKS TAPROOM - GRAND RAPIDS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '7 MONKS TAPROOM - GRAND RAPIDS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Steve Schultz', jsonb_build_array(jsonb_build_object('phone', '(616) 265-5417', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = '7 MONKS TAPROOM - GRAND RAPIDS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Steve Schultz @ 7 MONKS TAPROOM - GRAND RAPIDS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Matt Dangremond at ACCLAIMED CATERING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ACCLAIMED CATERING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matt Dangremond', jsonb_build_array(jsonb_build_object('phone', '(269) 682-5066', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ACCLAIMED CATERING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matt Dangremond @ ACCLAIMED CATERING',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Alex Chavez at ACCLAIMED CATERING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ACCLAIMED CATERING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alex Chavez', jsonb_build_array(jsonb_build_object('phone', '(269) 682-5066', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ACCLAIMED CATERING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alex Chavez @ ACCLAIMED CATERING',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kassie Wellman at ALPHA CHI OMEGA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ALPHA CHI OMEGA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kassie Wellman', jsonb_build_array(jsonb_build_object('phone', '(517) 332-0821', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ALPHA CHI OMEGA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kassie Wellman @ ALPHA CHI OMEGA',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Lindasia   Kennedy at AMWAY GRAND PLAZA HOTEL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'AMWAY GRAND PLAZA HOTEL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lindasia   Kennedy', jsonb_build_array(jsonb_build_object('phone', '(616) 774-2000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'AMWAY GRAND PLAZA HOTEL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lindasia   Kennedy @ AMWAY GRAND PLAZA HOTEL',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'AMWAY GRAND PLAZA HOTEL' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message - food procurement line - call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Mia McClure at AMWAY GRAND PLAZA HOTEL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'AMWAY GRAND PLAZA HOTEL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mia McClure', jsonb_build_array(jsonb_build_object('phone', '(616) 774-2000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'AMWAY GRAND PLAZA HOTEL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mia McClure @ AMWAY GRAND PLAZA HOTEL',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Josh Brack at AMWAY GRAND PLAZA HOTEL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'AMWAY GRAND PLAZA HOTEL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Josh Brack', jsonb_build_array(jsonb_build_object('phone', '(616) 774-2000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'AMWAY GRAND PLAZA HOTEL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Josh Brack @ AMWAY GRAND PLAZA HOTEL',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Alex Ley at ARTURO''S TACO''S
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ARTURO''S TACO''S' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alex Ley', jsonb_build_array(jsonb_build_object('phone', '(616) 844-4100', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ARTURO''S TACO''S' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alex Ley @ ARTURO''S TACO''S',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ARTURO''S TACO''S' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No voice mail - call back Froday 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Todd Linsley at Ada House The Post
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ada House The Post' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Todd Linsley', jsonb_build_array(jsonb_build_object('phone', '(616) 803-8595', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ada House The Post' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Todd Linsley @ Ada House The Post',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Becca Prieur at Ala Mode Restaurant
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ala Mode Restaurant' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Becca Prieur', jsonb_build_array(jsonb_build_object('phone', '(231) 796-6633', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ala Mode Restaurant' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Becca Prieur @ Ala Mode Restaurant',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Beth Colley at American House Jenison-Cottonwood M
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'American House Jenison-Cottonwood M' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Beth Colley', jsonb_build_array(jsonb_build_object('phone', '(616) 222-0712', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'American House Jenison-Cottonwood M' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Beth Colley @ American House Jenison-Cottonwood M',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Matthew Krauss at Applause Catering & Events
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Applause Catering & Events' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matthew Krauss', jsonb_build_array(jsonb_build_object('phone', '(616) 940-0001', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Applause Catering & Events' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matthew Krauss @ Applause Catering & Events',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Matthew Krauss at Applause Catering & Events
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Applause Catering & Events' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matthew Krauss', jsonb_build_array(jsonb_build_object('phone', '(616) 940-0001', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Applause Catering & Events' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matthew Krauss @ Applause Catering & Events',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bryan Riley at Apple Mountain
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Apple Mountain' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bryan Riley', jsonb_build_array(jsonb_build_object('phone', '(989) 781-6789', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Apple Mountain' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bryan Riley @ Apple Mountain',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Russ Chanin at Apple Mountain
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Apple Mountain' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Russ Chanin', jsonb_build_array(jsonb_build_object('phone', '(989) 781-6789', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Apple Mountain' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Russ Chanin @ Apple Mountain',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Mike  Riccardi at Asher Creek Creamery and Deli
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Asher Creek Creamery and Deli' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mike  Riccardi', jsonb_build_array(jsonb_build_object('phone', '(517) 522-4141', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Asher Creek Creamery and Deli' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mike  Riccardi @ Asher Creek Creamery and Deli',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Matthew Gibson at Autumn House Williamsburg
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Autumn House Williamsburg' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matthew Gibson', jsonb_build_array(jsonb_build_object('phone', '(231) 590-0226', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Autumn House Williamsburg' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matthew Gibson @ Autumn House Williamsburg',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Carol Amman at BACK FORTY (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BACK FORTY (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Carol Amman', jsonb_build_array(jsonb_build_object('phone', '(989) 845-4744', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BACK FORTY (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Carol Amman @ BACK FORTY (THE)',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BACK FORTY (THE)' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Carol out of office - call bacl 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Arn Stiles at BAIR LAKE BIBLE CAMP
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BAIR LAKE BIBLE CAMP' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Arn Stiles', jsonb_build_array(jsonb_build_object('phone', '(269) 244-5193', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BAIR LAKE BIBLE CAMP' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Arn Stiles @ BAIR LAKE BIBLE CAMP',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Leona  Rairigh at BARRY CTY COMMISSION ON AGING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BARRY CTY COMMISSION ON AGING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Leona  Rairigh', jsonb_build_array(jsonb_build_object('phone', '(269) 948-4856', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BARRY CTY COMMISSION ON AGING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Leona  Rairigh @ BARRY CTY COMMISSION ON AGING',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Holly  Bollenbach at BIG APPLE BAGEL - PORTAGE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Holly  Bollenbach', jsonb_build_array(jsonb_build_object('phone', '(231) 755-1715', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Holly  Bollenbach @ BIG APPLE BAGEL - PORTAGE',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jason LeBlanc at BIG APPLE BAGEL - PORTAGE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jason LeBlanc', jsonb_build_array(jsonb_build_object('phone', '(906) 248-8220', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jason LeBlanc @ BIG APPLE BAGEL - PORTAGE',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Send sample - not received - order from GFS', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Eric Scott at BAYMONT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BAYMONT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Eric Scott', jsonb_build_array(jsonb_build_object('phone', '(616) 842-1999', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BAYMONT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Eric Scott @ BAYMONT',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BAYMONT' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Sold original', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Pebbles Malstrom at BEAMERS RESTAURANT-SPARTAN WEST BC
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BEAMERS RESTAURANT-SPARTAN WEST BC' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Pebbles Malstrom', jsonb_build_array(jsonb_build_object('phone', '(231) 757-2391', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BEAMERS RESTAURANT-SPARTAN WEST BC' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Pebbles Malstrom @ BEAMERS RESTAURANT-SPARTAN WEST BC',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jason Boussom at BIG APPLE BAGEL - PORTAGE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jason Boussom', jsonb_build_array(jsonb_build_object('phone', '(269) 321-3688', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jason Boussom @ BIG APPLE BAGEL - PORTAGE',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BIG APPLE BAGEL - PORTAGE' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Send sample - not received - order from GFS', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Andrew  Hoffman at BLIND SQUIRREL TAVERN (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BLIND SQUIRREL TAVERN (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Andrew  Hoffman', jsonb_build_array(jsonb_build_object('phone', '(231) 335-2147', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BLIND SQUIRREL TAVERN (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Andrew  Hoffman @ BLIND SQUIRREL TAVERN (THE)',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BLIND SQUIRREL TAVERN (THE)' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Send sample - not received - order from GFS', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Laura Britton at BRICKS GEORGETOWN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BRICKS GEORGETOWN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Laura Britton', jsonb_build_array(jsonb_build_object('phone', '(616) 797-8077', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BRICKS GEORGETOWN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Laura Britton @ BRICKS GEORGETOWN',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Marie Borkholder at BULLSEYE MARKETPLACE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BULLSEYE MARKETPLACE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Marie Borkholder', jsonb_build_array(jsonb_build_object('phone', '(269) 858-3225', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BULLSEYE MARKETPLACE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Marie Borkholder @ BULLSEYE MARKETPLACE',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BULLSEYE MARKETPLACE' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No opportuity - not on menu plans', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: jeff farida at BRIGHTON MARKET
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BRIGHTON MARKET' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'jeff farida', jsonb_build_array(jsonb_build_object('phone', '(810) 229-6138', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BRIGHTON MARKET' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'jeff farida @ BRIGHTON MARKET',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Chelsea Alsup at BRONSON COMMONS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BRONSON COMMONS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Chelsea Alsup', jsonb_build_array(jsonb_build_object('phone', '(269) 283-5200', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BRONSON COMMONS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Chelsea Alsup @ BRONSON COMMONS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Andrew Wright at BSA-CAMP ROTARY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BSA-CAMP ROTARY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Andrew Wright', jsonb_build_array(jsonb_build_object('phone', '(989) 386-7943', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BSA-CAMP ROTARY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Andrew Wright @ BSA-CAMP ROTARY',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Randy rowlson at Back Alley Saloon
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Back Alley Saloon' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Randy rowlson', jsonb_build_array(jsonb_build_object('phone', '(269) 343-2456', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Back Alley Saloon' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Randy rowlson @ Back Alley Saloon',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Back Alley Saloon' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Customer requested sample - senf to Dale at MFB', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: pETE PHARES at Backroads Tavern
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Backroads Tavern' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'pETE PHARES', jsonb_build_array(jsonb_build_object('phone', '(260) 499-1893', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Backroads Tavern' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'pETE PHARES @ Backroads Tavern',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Backroads Tavern' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back Monday 11/10 - aftger 10:00 AM', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Marie Borkholder at BULLSEYE MARKETPLACE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BULLSEYE MARKETPLACE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Marie Borkholder', jsonb_build_array(jsonb_build_object('phone', '(269) 858-3225', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BULLSEYE MARKETPLACE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Marie Borkholder @ BULLSEYE MARKETPLACE',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Becky Coggins at Barrister Brewing Co
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Barrister Brewing Co' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Becky Coggins', jsonb_build_array(jsonb_build_object('phone', '(989) 472-3054', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Barrister Brewing Co' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Becky Coggins @ Barrister Brewing Co',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Barrister Brewing Co' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message - fdsvc mgr. - call back 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Quintin Wenglarz at Beachside Tavern
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Beachside Tavern' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Quintin Wenglarz', jsonb_build_array(jsonb_build_object('phone', '(574) 485-1086', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Beachside Tavern' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Quintin Wenglarz @ Beachside Tavern',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Beachside Tavern' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message - fdsvc mgr. - call back 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: William Mathes at Black Bear Golf
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Black Bear Golf' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'William Mathes', jsonb_build_array(jsonb_build_object('phone', '(989) 983-4441', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Black Bear Golf' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'William Mathes @ Black Bear Golf',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Black Bear Golf' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for William - call back 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: DJ Clark at Booher''s Market and Diner
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Booher''s Market and Diner' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'DJ Clark', jsonb_build_array(jsonb_build_object('phone', '(517) 960-7419', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Booher''s Market and Diner' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'DJ Clark @ Booher''s Market and Diner',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Booher''s Market and Diner' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call DJ after 10:00 AM - 117', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Quintin Wenglarz at Beachside Tavern
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Beachside Tavern' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Quintin Wenglarz', jsonb_build_array(jsonb_build_object('phone', '(574) 485-1086', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Beachside Tavern' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Quintin Wenglarz @ Beachside Tavern',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: susan mahler at CAFE MAX
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CAFE MAX' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'susan mahler', jsonb_build_array(jsonb_build_object('phone', '(574) 842-2511', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CAFE MAX' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'susan mahler @ CAFE MAX',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CAFE MAX' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back after 2:00 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Codey Moore at Booyahs Bar & Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Booyahs Bar & Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Codey Moore', jsonb_build_array(jsonb_build_object('phone', '(231) 798-9900', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Booyahs Bar & Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Codey Moore @ Booyahs Bar & Grill',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: kara spangler at CASS COUNTY MEDICAL FACILITY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CASS COUNTY MEDICAL FACILITY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'kara spangler', jsonb_build_array(jsonb_build_object('phone', '(269) 445-3801', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CASS COUNTY MEDICAL FACILITY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'kara spangler @ CASS COUNTY MEDICAL FACILITY',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CASS COUNTY MEDICAL FACILITY' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Called 3x - left messages', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Deni  smiljanovski at Brown Iron Brewhouse - Washington
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Brown Iron Brewhouse - Washington' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Deni  smiljanovski', jsonb_build_array(jsonb_build_object('phone', '(586) 697-3300', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Brown Iron Brewhouse - Washington' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Deni  smiljanovski @ Brown Iron Brewhouse - Washington',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Anikah Webster at Bud n’ Stanley’s
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Bud n’ Stanley’s' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Anikah Webster', jsonb_build_array(jsonb_build_object('phone', '(616) 361-9782', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Bud n’ Stanley’s' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Anikah Webster @ Bud n’ Stanley’s',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kaylee Depew at Butcher Block Social
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Butcher Block Social' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kaylee Depew', jsonb_build_array(jsonb_build_object('phone', '(616) 622-1004', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Butcher Block Social' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kaylee Depew @ Butcher Block Social',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Sharon Weber at Byron Center Heritage Elementary
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Byron Center Heritage Elementary' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Sharon Weber', jsonb_build_array(jsonb_build_object('phone', '(616) 878-6800', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Byron Center Heritage Elementary' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Sharon Weber @ Byron Center Heritage Elementary',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Naomi Dempsey at CELEBRATION CINEMA LANSING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CELEBRATION CINEMA LANSING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Naomi Dempsey', jsonb_build_array(jsonb_build_object('phone', '(517) 272-9289', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CELEBRATION CINEMA LANSING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Naomi Dempsey @ CELEBRATION CINEMA LANSING',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CELEBRATION CINEMA LANSING' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Customer requested sample - senf to Dale at MFB', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Kelly Beattie at CAMP BLODGETT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CAMP BLODGETT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kelly Beattie', jsonb_build_array(jsonb_build_object('phone', '(616) 949-0780', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CAMP BLODGETT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kelly Beattie @ CAMP BLODGETT',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Heather Beaver at CAMP CROSLEY YMCA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CAMP CROSLEY YMCA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Heather Beaver', jsonb_build_array(jsonb_build_object('phone', '(574) 834-2331', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CAMP CROSLEY YMCA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Heather Beaver @ CAMP CROSLEY YMCA',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: TJ Harris at CANDIED YAM
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CANDIED YAM' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'TJ Harris', jsonb_build_array(jsonb_build_object('phone', '(616) 407-0311', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CANDIED YAM' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'TJ Harris @ CANDIED YAM',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Gail Hilliker at CASCADE TRAILS SENIOR LIVING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CASCADE TRAILS SENIOR LIVING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Gail Hilliker', jsonb_build_array(jsonb_build_object('phone', '(616) 383-2866', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CASCADE TRAILS SENIOR LIVING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Gail Hilliker @ CASCADE TRAILS SENIOR LIVING',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ariana Belcher at CHATEAU AERONAUTIQUE WINERY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CHATEAU AERONAUTIQUE WINERY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ariana Belcher', jsonb_build_array(jsonb_build_object('phone', '(517) 446-4052', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CHATEAU AERONAUTIQUE WINERY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ariana Belcher @ CHATEAU AERONAUTIQUE WINERY',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CHATEAU AERONAUTIQUE WINERY' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Ariana 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Rachel  Fontes at CATAWBA ISLAND CLUB
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CATAWBA ISLAND CLUB' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Rachel  Fontes', jsonb_build_array(jsonb_build_object('phone', '(419) 797-4424', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CATAWBA ISLAND CLUB' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Rachel  Fontes @ CATAWBA ISLAND CLUB',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Brandon Grzegorczyk at CDS - Kettering University
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CDS - Kettering University' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brandon Grzegorczyk', jsonb_build_array(jsonb_build_object('phone', '(800) 955-4464', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CDS - Kettering University' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brandon Grzegorczyk @ CDS - Kettering University',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Joe  Bolis at CDS-SOUTH HAVEN CONFERENCE CTR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CDS-SOUTH HAVEN CONFERENCE CTR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Joe  Bolis', jsonb_build_array(jsonb_build_object('phone', '(269) 637-5287', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CDS-SOUTH HAVEN CONFERENCE CTR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Joe  Bolis @ CDS-SOUTH HAVEN CONFERENCE CTR',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jon Ruppert at CLEMENTINE''S SALOON
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CLEMENTINE''S SALOON' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jon Ruppert', jsonb_build_array(jsonb_build_object('phone', '(269) 637-4755', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CLEMENTINE''S SALOON' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jon Ruppert @ CLEMENTINE''S SALOON',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CLEMENTINE''S SALOON' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call after 10:00 AM', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Lauryn Corkwell at CENTER LAKE BIBLE CAMP
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CENTER LAKE BIBLE CAMP' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lauryn Corkwell', jsonb_build_array(jsonb_build_object('phone', '(231) 829-3441', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CENTER LAKE BIBLE CAMP' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lauryn Corkwell @ CENTER LAKE BIBLE CAMP',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tondalayo Rose at CORINE''S CAKES & CATERING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CORINE''S CAKES & CATERING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tondalayo Rose', jsonb_build_array(jsonb_build_object('phone', '(231) 760-6809', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CORINE''S CAKES & CATERING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tondalayo Rose @ CORINE''S CAKES & CATERING',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CORINE''S CAKES & CATERING' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message - call back later in day - 1/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: William Baird at CRAN HILL RANCH
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CRAN HILL RANCH' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'William Baird', jsonb_build_array(jsonb_build_object('phone', '(231) 796-7669', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CRAN HILL RANCH' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'William Baird @ CRAN HILL RANCH',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CRAN HILL RANCH' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Melanie Ruppert at CLEMENTINE''S SALOON
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CLEMENTINE''S SALOON' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Melanie Ruppert', jsonb_build_array(jsonb_build_object('phone', '(269) 637-4755', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CLEMENTINE''S SALOON' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Melanie Ruppert @ CLEMENTINE''S SALOON',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Angi Butler at COMMUNITY HOSPITAL OF BREMEN-H05464
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'COMMUNITY HOSPITAL OF BREMEN-H05464' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Angi Butler', jsonb_build_array(jsonb_build_object('phone', '(574) 546-2211', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'COMMUNITY HOSPITAL OF BREMEN-H05464' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Angi Butler @ COMMUNITY HOSPITAL OF BREMEN-H05464',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kevin Simons at CULINARY INSTITUTE OF MICHIGAN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CULINARY INSTITUTE OF MICHIGAN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kevin Simons', jsonb_build_array(jsonb_build_object('phone', '(855) 487-7888', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CULINARY INSTITUTE OF MICHIGAN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kevin Simons @ CULINARY INSTITUTE OF MICHIGAN',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CULINARY INSTITUTE OF MICHIGAN' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Kevin - call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Sara Jorgensen at COURTYARD GRAND RAPIDS DOWNTOWN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'COURTYARD GRAND RAPIDS DOWNTOWN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Sara Jorgensen', jsonb_build_array(jsonb_build_object('phone', '(616) 242-6000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'COURTYARD GRAND RAPIDS DOWNTOWN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Sara Jorgensen @ COURTYARD GRAND RAPIDS DOWNTOWN',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: TINA NEWSUM at Caddie Cones
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Caddie Cones' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'TINA NEWSUM', jsonb_build_array(jsonb_build_object('phone', '(269) 244-0027', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Caddie Cones' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'TINA NEWSUM @ Caddie Cones',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Caddie Cones' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No opportunity to leave message  -- call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Asher Moss at CRYSTAL VALLEY CATERING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CRYSTAL VALLEY CATERING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Asher Moss', jsonb_build_array(jsonb_build_object('phone', '(574) 825-9696', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'CRYSTAL VALLEY CATERING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Asher Moss @ CRYSTAL VALLEY CATERING',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Noreen Deephouse at Canary Inn Bar Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Canary Inn Bar Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Noreen Deephouse', jsonb_build_array(jsonb_build_object('phone', '(231) 744-2381', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Canary Inn Bar Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Noreen Deephouse @ Canary Inn Bar Grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Canary Inn Bar Grill' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Noreen - call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Bri Bautista at City Limits
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'City Limits' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bri Bautista', jsonb_build_array(jsonb_build_object('phone', '(231) 652-6320', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'City Limits' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bri Bautista @ City Limits',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'City Limits' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back 2:30 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: James Wilkinson at Culvers Muskegon MI Independence Dr
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Culvers Muskegon MI Independence Dr' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'James Wilkinson', jsonb_build_array(jsonb_build_object('phone', '(231) 246-2593', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Culvers Muskegon MI Independence Dr' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'James Wilkinson @ Culvers Muskegon MI Independence Dr',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Culvers Muskegon MI Independence Dr' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back 9:00 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Tyler VanAntwerpen at Canopy - F&B 152141E
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Canopy - F&B 152141E' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tyler VanAntwerpen', jsonb_build_array(jsonb_build_object('phone', '(616) 456-6200', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Canopy - F&B 152141E' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tyler VanAntwerpen @ Canopy - F&B 152141E',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Brian  Mason at Carerite- Harbor Post Acute Center
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Carerite- Harbor Post Acute Center' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brian  Mason', jsonb_build_array(jsonb_build_object('phone', '(616) 333-1200', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Carerite- Harbor Post Acute Center' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brian  Mason @ Carerite- Harbor Post Acute Center',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Dana Franco at Champs Bar & Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Champs Bar & Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dana Franco', jsonb_build_array(jsonb_build_object('phone', '(616) 997-9227', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Champs Bar & Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dana Franco @ Champs Bar & Grill',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: sam barr at Cherry Republic- Glen Arbor Public
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Cherry Republic- Glen Arbor Public' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'sam barr', jsonb_build_array(jsonb_build_object('phone', '(231) 226-3014', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Cherry Republic- Glen Arbor Public' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'sam barr @ Cherry Republic- Glen Arbor Public',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: James Fuller at Choice Services - Camp Grayling - B
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Choice Services - Camp Grayling - B' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'James Fuller', jsonb_build_array(jsonb_build_object('phone', '(989) 344-6120', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Choice Services - Camp Grayling - B' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'James Fuller @ Choice Services - Camp Grayling - B',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: James Fuller at Choice Services - Camp Grayling - B
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Choice Services - Camp Grayling - B' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'James Fuller', jsonb_build_array(jsonb_build_object('phone', '(989) 344-6120', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Choice Services - Camp Grayling - B' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'James Fuller @ Choice Services - Camp Grayling - B',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Berto Mendoza at Cinco De Mayo Allendale
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Cinco De Mayo Allendale' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Berto Mendoza', jsonb_build_array(jsonb_build_object('phone', '(616) 986-1177', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Cinco De Mayo Allendale' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Berto Mendoza @ Cinco De Mayo Allendale',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: JESSICA MCGUIRE at DORR TRUCK STOP/EXIT 76 CORP
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DORR TRUCK STOP/EXIT 76 CORP' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'JESSICA MCGUIRE', jsonb_build_array(jsonb_build_object('phone', '(616) 877-5555', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DORR TRUCK STOP/EXIT 76 CORP' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'JESSICA MCGUIRE @ DORR TRUCK STOP/EXIT 76 CORP',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DORR TRUCK STOP/EXIT 76 CORP' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Number not in service', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Branndan Kanuszewski at Corewell Health Blodgett Hospital N
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Blodgett Hospital N' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Branndan Kanuszewski', jsonb_build_array(jsonb_build_object('phone', '(616) 774-7444', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Blodgett Hospital N' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Branndan Kanuszewski @ Corewell Health Blodgett Hospital N',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Mick Rickerd at Corewell Health Butterworth Hospita
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Butterworth Hospita' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mick Rickerd', jsonb_build_array(jsonb_build_object('phone', '(616) 391-1774', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Butterworth Hospita' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mick Rickerd @ Corewell Health Butterworth Hospita',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Cassandra Routley at Corewell Health Greenville Hosp-Nut
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Greenville Hosp-Nut' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cassandra Routley', jsonb_build_array(jsonb_build_object('phone', '(616) 754-4691', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Greenville Hosp-Nut' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cassandra Routley @ Corewell Health Greenville Hosp-Nut',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Molly Orrico at Corewell Health Lakeland Hosp St Jo
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Lakeland Hosp St Jo' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Molly Orrico', jsonb_build_array(jsonb_build_object('phone', '(269) 983-8300', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Corewell Health Lakeland Hosp St Jo' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Molly Orrico @ Corewell Health Lakeland Hosp St Jo',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Michele Stuart at Cornerstone Univ/Food Service - 355
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Cornerstone Univ/Food Service - 355' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Michele Stuart', jsonb_build_array(jsonb_build_object('phone', '(616) 949-5300', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Cornerstone Univ/Food Service - 355' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Michele Stuart @ Cornerstone Univ/Food Service - 355',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tom Crowes-Garey at Crowes Nest Café
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Crowes Nest Café' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tom Crowes-Garey', jsonb_build_array(jsonb_build_object('phone', '(517) 536-7073', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Crowes Nest Café' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tom Crowes-Garey @ Crowes Nest Café',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Dan Wojhan at DUNE DOGZ
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DUNE DOGZ' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dan Wojhan', jsonb_build_array(jsonb_build_object('phone', '(616) 738-3649', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DUNE DOGZ' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dan Wojhan @ DUNE DOGZ',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DUNE DOGZ' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Closed for season - 2025', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Dana  D''agostino at D''AGOSTINO''S RESTAURANT/ NAVAJO LOU
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'D''AGOSTINO''S RESTAURANT/ NAVAJO LOU' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dana  D''agostino', jsonb_build_array(jsonb_build_object('phone', '(269) 465-3434', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'D''AGOSTINO''S RESTAURANT/ NAVAJO LOU' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dana  D''agostino @ D''AGOSTINO''S RESTAURANT/ NAVAJO LOU',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: April Vilminot at DECK DOWN UNDER (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DECK DOWN UNDER (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'April Vilminot', jsonb_build_array(jsonb_build_object('phone', '(517) 900-9213', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'DECK DOWN UNDER (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'April Vilminot @ DECK DOWN UNDER (THE)',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Julia McEntee at Dinks & Dingers Social Club
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Dinks & Dingers Social Club' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Julia McEntee', jsonb_build_array(jsonb_build_object('phone', '(616) 343-8343', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Dinks & Dingers Social Club' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Julia McEntee @ Dinks & Dingers Social Club',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Dinks & Dingers Social Club' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Fred Romer at Docks Landing
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Docks Landing' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Fred Romer', jsonb_build_array(jsonb_build_object('phone', '(260) 303-1125', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Docks Landing' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Fred Romer @ Docks Landing',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Docks Landing' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back Friday 10:30', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Kane Anderson at Dale''s Bar & Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Dale''s Bar & Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kane Anderson', jsonb_build_array(jsonb_build_object('phone', '(419) 893-3113', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Dale''s Bar & Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kane Anderson @ Dale''s Bar & Grill',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kat Hoffmann at Daydreamer Domes
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Daydreamer Domes' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kat Hoffmann', jsonb_build_array(jsonb_build_object('phone', '(269) 906-0916', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Daydreamer Domes' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kat Hoffmann @ Daydreamer Domes',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Frank Rock at Duck Lake Tavern
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Duck Lake Tavern' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Frank Rock', jsonb_build_array(jsonb_build_object('phone', '(517) 857-4700', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Duck Lake Tavern' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Frank Rock @ Duck Lake Tavern',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Duck Lake Tavern' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No answer - call back later in the day', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Sonia Buonodono at Eaglemonk Pub and Brewery
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Eaglemonk Pub and Brewery' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Sonia Buonodono', jsonb_build_array(jsonb_build_object('phone', '(517) 708-7350', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Eaglemonk Pub and Brewery' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Sonia Buonodono @ Eaglemonk Pub and Brewery',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Eaglemonk Pub and Brewery' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back Friday after 3:00 - 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Michelle Waber at East Kentwood Concessions
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'East Kentwood Concessions' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Michelle Waber', jsonb_build_array(jsonb_build_object('phone', '(616) 455-4400', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'East Kentwood Concessions' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Michelle Waber @ East Kentwood Concessions',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'East Kentwood Concessions' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Michelle on voice mail - call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Zenos Dupuis at Dupuis
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Dupuis' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Zenos Dupuis', jsonb_build_array(jsonb_build_object('phone', '(989) 270-1073', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Dupuis' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Zenos Dupuis @ Dupuis',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: DIVA - Sous Chef of Sass  (better than Salty Sal) at EAGLE VILLAGE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EAGLE VILLAGE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'DIVA - Sous Chef of Sass  (better than Salty Sal)', jsonb_build_array(jsonb_build_object('phone', '(231) 832-2234', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EAGLE VILLAGE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'DIVA - Sous Chef of Sass  (better than Salty Sal) @ EAGLE VILLAGE',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Itzel Garcia at EL JALAPENO TAQUERIA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EL JALAPENO TAQUERIA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Itzel Garcia', jsonb_build_array(jsonb_build_object('phone', '(616) 712-6344', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EL JALAPENO TAQUERIA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Itzel Garcia @ EL JALAPENO TAQUERIA',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Chad Ramenda at ELKHART GENERAL HOSPITAL-H045769
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ELKHART GENERAL HOSPITAL-H045769' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Chad Ramenda', jsonb_build_array(jsonb_build_object('phone', '(574) 294-2621', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ELKHART GENERAL HOSPITAL-H045769' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Chad Ramenda @ ELKHART GENERAL HOSPITAL-H045769',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Devin Taylor at EXODUS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EXODUS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Devin Taylor', jsonb_build_array(jsonb_build_object('phone', '(616) 242-9130', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EXODUS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Devin Taylor @ EXODUS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Dana Wade at EXPLORERS LEARNING CENTER
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EXPLORERS LEARNING CENTER' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dana Wade', jsonb_build_array(jsonb_build_object('phone', '(231) 747-7175', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EXPLORERS LEARNING CENTER' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dana Wade @ EXPLORERS LEARNING CENTER',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ricky Schiebner at EXPRESS CAFE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EXPRESS CAFE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ricky Schiebner', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'EXPRESS CAFE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ricky Schiebner @ EXPRESS CAFE',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Chris Graebner at Elk Lake Bar And Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Elk Lake Bar And Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Chris Graebner', jsonb_build_array(jsonb_build_object('phone', '(989) 701-2110', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Elk Lake Bar And Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Chris Graebner @ Elk Lake Bar And Grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Elk Lake Bar And Grill' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No answer or voice mail opportunity', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Leah Flach at Eudicis Pizza Of Midland
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Eudicis Pizza Of Midland' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Leah Flach', jsonb_build_array(jsonb_build_object('phone', '(989) 423-8209', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Eudicis Pizza Of Midland' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Leah Flach @ Eudicis Pizza Of Midland',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Eudicis Pizza Of Midland' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Leah -', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: teresa emery at FENNVILLE ELEMENTARY SCHOOL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FENNVILLE ELEMENTARY SCHOOL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'teresa emery', jsonb_build_array(jsonb_build_object('phone', '(269) 722-3900', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FENNVILLE ELEMENTARY SCHOOL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'teresa emery @ FENNVILLE ELEMENTARY SCHOOL',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FENNVILLE ELEMENTARY SCHOOL' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left my contaact infomation for Teresa', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Garth  Parish at FLANNIGAN''S GOAT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FLANNIGAN''S GOAT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Garth  Parish', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FLANNIGAN''S GOAT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Garth  Parish @ FLANNIGAN''S GOAT',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FLANNIGAN''S GOAT' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No contact information', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Big Daddy at Fife Lake Inn
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Fife Lake Inn' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Big Daddy', jsonb_build_array(jsonb_build_object('phone', '(231) 879-6009', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Fife Lake Inn' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Big Daddy @ Fife Lake Inn',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Fife Lake Inn' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No asnwer or voice mail.', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Tiffonnie Nelsom at FIRESIDE CRAFT BURGERS & BREWS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FIRESIDE CRAFT BURGERS & BREWS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tiffonnie Nelsom', jsonb_build_array(jsonb_build_object('phone', '(260) 768-3473', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FIRESIDE CRAFT BURGERS & BREWS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tiffonnie Nelsom @ FIRESIDE CRAFT BURGERS & BREWS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Alexis Farley at Freds Of Roscommon
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Freds Of Roscommon' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alexis Farley', jsonb_build_array(jsonb_build_object('phone', '(989) 275-6565', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Freds Of Roscommon' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alexis Farley @ Freds Of Roscommon',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Freds Of Roscommon' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Closed -bowling lanes  call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Joe Huls at FLUSHING VALLEY GOLF COURSE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FLUSHING VALLEY GOLF COURSE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Joe Huls', jsonb_build_array(jsonb_build_object('phone', '(810) 487-0792', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FLUSHING VALLEY GOLF COURSE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Joe Huls @ FLUSHING VALLEY GOLF COURSE',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Alicia  Lockerby at FSU - THE ROCK CAFE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FSU - THE ROCK CAFE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alicia  Lockerby', jsonb_build_array(jsonb_build_object('phone', '(231) 591-2206', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'FSU - THE ROCK CAFE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alicia  Lockerby @ FSU - THE ROCK CAFE',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Monica Price at G R PUBLIC SCHOOLS NUTRITION CTR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G R PUBLIC SCHOOLS NUTRITION CTR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Monica Price', jsonb_build_array(jsonb_build_object('phone', '(616) 819-2135', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G R PUBLIC SCHOOLS NUTRITION CTR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Monica Price @ G R PUBLIC SCHOOLS NUTRITION CTR',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G R PUBLIC SCHOOLS NUTRITION CTR' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No Monica on staff - incorrect name', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Julie Clairmont at Food Service - Kitchen YMCA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Food Service - Kitchen YMCA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Julie Clairmont', jsonb_build_array(jsonb_build_object('phone', '(616) 855-9600', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Food Service - Kitchen YMCA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Julie Clairmont @ Food Service - Kitchen YMCA',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kerrie Ellis at G''S PIZZERIA (KALKASKA)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G''S PIZZERIA (KALKASKA)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kerrie Ellis', jsonb_build_array(jsonb_build_object('phone', '(231) 258-5556', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G''S PIZZERIA (KALKASKA)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kerrie Ellis @ G''S PIZZERIA (KALKASKA)',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G''S PIZZERIA (KALKASKA)' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Have sample - will order garlic', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Steve Lee at Freighter''s Eatery and Taproom
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Freighter''s Eatery and Taproom' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Steve Lee', jsonb_build_array(jsonb_build_object('phone', '(810) 941-6010', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Freighter''s Eatery and Taproom' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Steve Lee @ Freighter''s Eatery and Taproom',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ryan Wabeke at Gun Lake Casino
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Gun Lake Casino' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ryan Wabeke', jsonb_build_array(jsonb_build_object('phone', '(269) 792-7777', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Gun Lake Casino' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ryan Wabeke @ Gun Lake Casino',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Gun Lake Casino' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Rayn - left my contact info.', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: DEAN SPEER at HI SKORE LANES
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HI SKORE LANES' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'DEAN SPEER', jsonb_build_array(jsonb_build_object('phone', '(989) 345-5580', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HI SKORE LANES' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'DEAN SPEER @ HI SKORE LANES',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HI SKORE LANES' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Reqested sample case - Phil - order from Eric (GFS rep)', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Logan Davis at G''S SAGINAW
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G''S SAGINAW' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Logan Davis', jsonb_build_array(jsonb_build_object('phone', '(989) 401-4774', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'G''S SAGINAW' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Logan Davis @ G''S SAGINAW',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jonathon Evans at GLENWOOD (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GLENWOOD (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jonathon Evans', jsonb_build_array(jsonb_build_object('phone', '(231) 889-3734', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GLENWOOD (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jonathon Evans @ GLENWOOD (THE)',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Aries Roberts at GRAND OAKS NURSING CENTER
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GRAND OAKS NURSING CENTER' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Aries Roberts', jsonb_build_array(jsonb_build_object('phone', '(231) 745-4648', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GRAND OAKS NURSING CENTER' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Aries Roberts @ GRAND OAKS NURSING CENTER',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Angela Franklin at GREEN ACRES OF LOWELL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GREEN ACRES OF LOWELL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Angela Franklin', jsonb_build_array(jsonb_build_object('phone', '(616) 987-9115', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GREEN ACRES OF LOWELL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Angela Franklin @ GREEN ACRES OF LOWELL',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Lisa Steed at GREENVILLE PUBLIC SCHOOLS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GREENVILLE PUBLIC SCHOOLS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lisa Steed', jsonb_build_array(jsonb_build_object('phone', '(616) 754-3686', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GREENVILLE PUBLIC SCHOOLS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lisa Steed @ GREENVILLE PUBLIC SCHOOLS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Paul Conkey at GRIFFIN GRILL & PUB
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GRIFFIN GRILL & PUB' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Paul Conkey', jsonb_build_array(jsonb_build_object('phone', '(269) 965-7206', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GRIFFIN GRILL & PUB' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Paul Conkey @ GRIFFIN GRILL & PUB',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tiffiny Ulman at GRIFFITH PUBLIC SCHOOLS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GRIFFITH PUBLIC SCHOOLS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tiffiny Ulman', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GRIFFITH PUBLIC SCHOOLS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tiffiny Ulman @ GRIFFITH PUBLIC SCHOOLS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Holly Petersen at Holly Pub And Grub
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Holly Pub And Grub' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Holly Petersen', jsonb_build_array(jsonb_build_object('phone', '(989) 283-1008', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Holly Pub And Grub' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Holly Petersen @ Holly Pub And Grub',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Holly Pub And Grub' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Holly out of office - she will call Phil', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Nicole Mayer at GVSU - ARA DCIH Cafe L
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GVSU - ARA DCIH Cafe L' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Nicole Mayer', jsonb_build_array(jsonb_build_object('phone', '(616) 331-5000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GVSU - ARA DCIH Cafe L' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Nicole Mayer @ GVSU - ARA DCIH Cafe L',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Cameron Gines at Grace Haven Senior Living
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Grace Haven Senior Living' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cameron Gines', jsonb_build_array(jsonb_build_object('phone', '(231) 824-7770', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Grace Haven Senior Living' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cameron Gines @ Grace Haven Senior Living',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Derek Heussner at Hopside Brewery
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hopside Brewery' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Derek Heussner', jsonb_build_array(jsonb_build_object('phone', '(989) 340-1280', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hopside Brewery' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Derek Heussner @ Hopside Brewery',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hopside Brewery' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Derek - call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: JOE HERMIZ at HALL STREET PARTY STORE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HALL STREET PARTY STORE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'JOE HERMIZ', jsonb_build_array(jsonb_build_object('phone', '(616) 246-1000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HALL STREET PARTY STORE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'JOE HERMIZ @ HALL STREET PARTY STORE',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Lacey replaced Lindsay at IONIA COUNTY COMMISSION ON AGING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'IONIA COUNTY COMMISSION ON AGING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lacey replaced Lindsay', jsonb_build_array(jsonb_build_object('phone', '(616) 527-5365', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'IONIA COUNTY COMMISSION ON AGING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lacey replaced Lindsay @ IONIA COUNTY COMMISSION ON AGING',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'IONIA COUNTY COMMISSION ON AGING' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Lindsay resigned - left message for Lacey - flu call needed', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: DEAN SPEER at HI SKORE LANES
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HI SKORE LANES' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'DEAN SPEER', jsonb_build_array(jsonb_build_object('phone', '(989) 345-5580', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HI SKORE LANES' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'DEAN SPEER @ HI SKORE LANES',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Dale Simmons at HOLY FAMILY CATHOLIC PARISH
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HOLY FAMILY CATHOLIC PARISH' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dale Simmons', jsonb_build_array(jsonb_build_object('phone', '(616) 891-9259', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HOLY FAMILY CATHOLIC PARISH' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dale Simmons @ HOLY FAMILY CATHOLIC PARISH',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: David Klein at Ivy Alley
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ivy Alley' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'David Klein', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ivy Alley' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'David Klein @ Ivy Alley',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ivy Alley' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Closed until December 2025 - Norte Dame campus', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Paula Moomey at HOUSEMAN''S FOODS WHITE CLOUD
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HOUSEMAN''S FOODS WHITE CLOUD' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Paula Moomey', jsonb_build_array(jsonb_build_object('phone', '(231) 689-1280', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HOUSEMAN''S FOODS WHITE CLOUD' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Paula Moomey @ HOUSEMAN''S FOODS WHITE CLOUD',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Cristal  Cook at Harvest Pointe At Thornapple Manor
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Harvest Pointe At Thornapple Manor' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cristal  Cook', jsonb_build_array(jsonb_build_object('phone', '(269) 945-2407', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Harvest Pointe At Thornapple Manor' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cristal  Cook @ Harvest Pointe At Thornapple Manor',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Chad Perreault at Heart & Seoul
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Heart & Seoul' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Chad Perreault', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Heart & Seoul' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Chad Perreault @ Heart & Seoul',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: David Meyer at Henrys
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Henrys' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'David Meyer', jsonb_build_array(jsonb_build_object('phone', '(419) 523-3663', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Henrys' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'David Meyer @ Henrys',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Colton Bates at High Caliber Karting And Entertainm
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'High Caliber Karting And Entertainm' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Colton Bates', jsonb_build_array(jsonb_build_object('phone', '(517) 721-1790', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'High Caliber Karting And Entertainm' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Colton Bates @ High Caliber Karting And Entertainm',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ron Wilson at JIM''S PIZZA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'JIM''S PIZZA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ron Wilson', jsonb_build_array(jsonb_build_object('phone', '(989) 288-7878', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'JIM''S PIZZA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ron Wilson @ JIM''S PIZZA',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'JIM''S PIZZA' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Closed - call back next Monday', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Joey Cucinella at JT''S PIZZA & SPIRITS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'JT''S PIZZA & SPIRITS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Joey Cucinella', jsonb_build_array(jsonb_build_object('phone', '(616) 942-1552', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'JT''S PIZZA & SPIRITS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Joey Cucinella @ JT''S PIZZA & SPIRITS',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'JT''S PIZZA & SPIRITS' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call to speak with Joey - Call next Tuesday AM - 7/11', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Katie  Peterson at Hope Network Wildwood West AFC
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hope Network Wildwood West AFC' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Katie  Peterson', jsonb_build_array(jsonb_build_object('phone', '(855) 407-7575', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hope Network Wildwood West AFC' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Katie  Peterson @ Hope Network Wildwood West AFC',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jennifer Whitaker at Jennifer Whitaker
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Jennifer Whitaker' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jennifer Whitaker', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Jennifer Whitaker' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jennifer Whitaker @ Jennifer Whitaker',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Jennifer Whitaker' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No contact information', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Derek Heussner at Hopside Brewery
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hopside Brewery' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Derek Heussner', jsonb_build_array(jsonb_build_object('phone', '(989) 340-1280', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hopside Brewery' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Derek Heussner @ Hopside Brewery',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Brad Schmidt at Hosel Rockets Golf & Whiskey Lounge
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hosel Rockets Golf & Whiskey Lounge' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brad Schmidt', jsonb_build_array(jsonb_build_object('phone', '(248) 599-3496', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hosel Rockets Golf & Whiskey Lounge' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brad Schmidt @ Hosel Rockets Golf & Whiskey Lounge',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Paul Hickman at INTERLOCHEN CENTER FOR THE ARTS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'INTERLOCHEN CENTER FOR THE ARTS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Paul Hickman', jsonb_build_array(jsonb_build_object('phone', '(231) 276-7200', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'INTERLOCHEN CENTER FOR THE ARTS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Paul Hickman @ INTERLOCHEN CENTER FOR THE ARTS',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Brandon Prater at Icarus Grilled Chicken
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Icarus Grilled Chicken' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brandon Prater', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Icarus Grilled Chicken' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brandon Prater @ Icarus Grilled Chicken',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Deny Feldbauer at Kzoo Station
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Kzoo Station' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Deny Feldbauer', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Kzoo Station' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Deny Feldbauer @ Kzoo Station',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Kzoo Station' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No contact information- e-mail link not active', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Zack Asel at LAKE SHORE RESORT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LAKE SHORE RESORT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Zack Asel', jsonb_build_array(jsonb_build_object('phone', '(989) 671-1125', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LAKE SHORE RESORT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Zack Asel @ LAKE SHORE RESORT',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LAKE SHORE RESORT' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Closed for the 2025 season', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jean Toner at Jean Toner
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Jean Toner' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jean Toner', jsonb_build_array(jsonb_build_object('phone', '(832) 290-2119', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Jean Toner' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jean Toner @ Jean Toner',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jeff Kowalczyk at Jeff Kowalczyk
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Jeff Kowalczyk' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jeff Kowalczyk', jsonb_build_array(jsonb_build_object('phone', '(269) 345-4127', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Jeff Kowalczyk' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jeff Kowalczyk @ Jeff Kowalczyk',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: AMY SPALSBURY at LFG BAR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LFG BAR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'AMY SPALSBURY', jsonb_build_array(jsonb_build_object('phone', '(269) 365-0112', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LFG BAR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'AMY SPALSBURY @ LFG BAR',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LFG BAR' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Matthew Huffman at LOG CABIN TAVERN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LOG CABIN TAVERN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matthew Huffman', jsonb_build_array(jsonb_build_object('phone', '(419) 832-0500', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LOG CABIN TAVERN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matthew Huffman @ LOG CABIN TAVERN',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LOG CABIN TAVERN' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'samples to:   csecor@logcabintavern.net', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Derrick Patton at LUDINGTON WOODS LIVING CTR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LUDINGTON WOODS LIVING CTR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Derrick Patton', jsonb_build_array(jsonb_build_object('phone', '(231) 845-6100', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LUDINGTON WOODS LIVING CTR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Derrick Patton @ LUDINGTON WOODS LIVING CTR',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LUDINGTON WOODS LIVING CTR' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Erin Mangan at KCTC East
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'KCTC East' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Erin Mangan', jsonb_build_array(jsonb_build_object('phone', '(616) 364-8421', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'KCTC East' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Erin Mangan @ KCTC East',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Casey Mannett at KJ CATERING COMPANY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'KJ CATERING COMPANY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Casey Mannett', jsonb_build_array(jsonb_build_object('phone', '(616) 805-4590', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'KJ CATERING COMPANY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Casey Mannett @ KJ CATERING COMPANY',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tadd  Morris at Kristi Morris
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Kristi Morris' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tadd  Morris', jsonb_build_array(jsonb_build_object('phone', '(260) 357-6557', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Kristi Morris' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tadd  Morris @ Kristi Morris',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Amanada  Weaver at Lake Dale Ale
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lake Dale Ale' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Amanada  Weaver', jsonb_build_array(jsonb_build_object('phone', '(219) 696-1256', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lake Dale Ale' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Amanada  Weaver @ Lake Dale Ale',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lake Dale Ale' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Amanda - will call back later 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Randy Davis at LA COCINA MEXICAN GRILL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LA COCINA MEXICAN GRILL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Randy Davis', jsonb_build_array(jsonb_build_object('phone', '(616) 200-5555', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LA COCINA MEXICAN GRILL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Randy Davis @ LA COCINA MEXICAN GRILL',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Rick Baker at Lakeshore Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lakeshore Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Rick Baker', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lakeshore Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Rick Baker @ Lakeshore Grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lakeshore Grill' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No contact information provided', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Zack Asel at LAKE SHORE RESORT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LAKE SHORE RESORT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Zack Asel', jsonb_build_array(jsonb_build_object('phone', '(989) 671-1125', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LAKE SHORE RESORT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Zack Asel @ LAKE SHORE RESORT',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Charlene  Jennings at LAKEVIEW TERRACE ASSISTED LIVING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LAKEVIEW TERRACE ASSISTED LIVING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Charlene  Jennings', jsonb_build_array(jsonb_build_object('phone', '(989) 279-0216', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LAKEVIEW TERRACE ASSISTED LIVING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Charlene  Jennings @ LAKEVIEW TERRACE ASSISTED LIVING',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: David  Petitpas at LC TAPHOUSE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LC TAPHOUSE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'David  Petitpas', jsonb_build_array(jsonb_build_object('phone', '(231) 839-4459', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LC TAPHOUSE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'David  Petitpas @ LC TAPHOUSE',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bubba Flores at Leroys Hot Stuff
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Leroys Hot Stuff' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bubba Flores', jsonb_build_array(jsonb_build_object('phone', '(219) 926-6211', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Leroys Hot Stuff' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bubba Flores @ Leroys Hot Stuff',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Leroys Hot Stuff' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Number was linked to PIne Grove Manner ???', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Trey Gregory at LOGAN''S IRISH PUB
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LOGAN''S IRISH PUB' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Trey Gregory', jsonb_build_array(jsonb_build_object('phone', '(419) 420-3602', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LOGAN''S IRISH PUB' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Trey Gregory @ LOGAN''S IRISH PUB',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Sarah McDonnell at Little Bay Gourmet
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Little Bay Gourmet' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Sarah McDonnell', jsonb_build_array(jsonb_build_object('phone', '(231) 622-5281', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Little Bay Gourmet' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Sarah McDonnell @ Little Bay Gourmet',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Little Bay Gourmet' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Sarah', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Kim Antrup at LUTHERAN LIFE VILLAGES KENDALLVILLE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LUTHERAN LIFE VILLAGES KENDALLVILLE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kim Antrup', jsonb_build_array(jsonb_build_object('phone', '(260) 635-3805', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'LUTHERAN LIFE VILLAGES KENDALLVILLE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kim Antrup @ LUTHERAN LIFE VILLAGES KENDALLVILLE',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Alec Sanders at Ludington Meat Company
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ludington Meat Company' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alec Sanders', jsonb_build_array(jsonb_build_object('phone', '(231) 425-3797', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ludington Meat Company' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alec Sanders @ Ludington Meat Company',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ludington Meat Company' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No menu changes now - call back in January', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Erik Bengston at Lake Michigan Camp
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lake Michigan Camp' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Erik Bengston', jsonb_build_array(jsonb_build_object('phone', '(231) 869-5627', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lake Michigan Camp' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Erik Bengston @ Lake Michigan Camp',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: James Gauthier at Lyndsey M Gauthier
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lyndsey M Gauthier' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'James Gauthier', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lyndsey M Gauthier' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'James Gauthier @ Lyndsey M Gauthier',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lyndsey M Gauthier' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No contact information for phone follow up', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Rick Baker at Lakeshore Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lakeshore Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Rick Baker', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lakeshore Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Rick Baker @ Lakeshore Grill',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Terry Hall at Lakeside Cafe
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lakeside Cafe' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Terry Hall', jsonb_build_array(jsonb_build_object('phone', '(231) 755-8600', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Lakeside Cafe' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Terry Hall @ Lakeside Cafe',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kathy McLaughlin at MAIN STREET BURGERS, PIZZA & ICE CR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MAIN STREET BURGERS, PIZZA & ICE CR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kathy McLaughlin', jsonb_build_array(jsonb_build_object('phone', '(269) 461-6888', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MAIN STREET BURGERS, PIZZA & ICE CR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kathy McLaughlin @ MAIN STREET BURGERS, PIZZA & ICE CR',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MAIN STREET BURGERS, PIZZA & ICE CR' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Closed for the 2025 season', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jennifer Feak at MANCINO''S-JAMES ST-HOLLAND
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MANCINO''S-JAMES ST-HOLLAND' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jennifer Feak', jsonb_build_array(jsonb_build_object('phone', '(616) 786-0600', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MANCINO''S-JAMES ST-HOLLAND' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jennifer Feak @ MANCINO''S-JAMES ST-HOLLAND',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MANCINO''S-JAMES ST-HOLLAND' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Jennifer out of office - need to call back  11/8 before 11:00 AM', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Hecate Philipps at Liminal Restaurant & Lounge
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Liminal Restaurant & Lounge' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Hecate Philipps', jsonb_build_array(jsonb_build_object('phone', '(906) 999-0074', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Liminal Restaurant & Lounge' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Hecate Philipps @ Liminal Restaurant & Lounge',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jeff Rodenbeck at MANCINOS - COMMISSARY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MANCINOS - COMMISSARY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jeff Rodenbeck', jsonb_build_array(jsonb_build_object('phone', '(231) 924-1222', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MANCINOS - COMMISSARY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jeff Rodenbeck @ MANCINOS - COMMISSARY',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MANCINOS - COMMISSARY' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: christina Dalton at Long Beach Country Club
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Long Beach Country Club' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'christina Dalton', jsonb_build_array(jsonb_build_object('phone', '(219) 872-0689', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Long Beach Country Club' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'christina Dalton @ Long Beach Country Club',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Cameron Baarstad at MARKET 22
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARKET 22' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cameron Baarstad', jsonb_build_array(jsonb_build_object('phone', '(231) 228-6422', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARKET 22' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cameron Baarstad @ MARKET 22',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARKET 22' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left number for Cameron - he will call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Nicole  Adams at MI Vet Homes at Grand Rapids- Kitch
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MI Vet Homes at Grand Rapids- Kitch' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Nicole  Adams', jsonb_build_array(jsonb_build_object('phone', '(616) 364-5300', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MI Vet Homes at Grand Rapids- Kitch' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Nicole  Adams @ MI Vet Homes at Grand Rapids- Kitch',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MI Vet Homes at Grand Rapids- Kitch' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Nicole  - e-mail Nicole  adamsm6@michigan.gov', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Cindy Estes at MAIL POUCH SALOON- SWANTON
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MAIL POUCH SALOON- SWANTON' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cindy Estes', jsonb_build_array(jsonb_build_object('phone', '(419) 825-5502', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MAIL POUCH SALOON- SWANTON' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cindy Estes @ MAIL POUCH SALOON- SWANTON',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jha’Mere Artis at MICHIGAN YOUTH CHALLENGE ACADEMY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHIGAN YOUTH CHALLENGE ACADEMY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jha’Mere Artis', jsonb_build_array(jsonb_build_object('phone', '(800) 372-0523', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHIGAN YOUTH CHALLENGE ACADEMY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jha’Mere Artis @ MICHIGAN YOUTH CHALLENGE ACADEMY',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHIGAN YOUTH CHALLENGE ACADEMY' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No opportunity', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: William Duff at MICHIGN CENTER EAGLES # 3634
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHIGN CENTER EAGLES # 3634' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'William Duff', jsonb_build_array(jsonb_build_object('phone', '(517) 764-6660', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHIGN CENTER EAGLES # 3634' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'William Duff @ MICHIGN CENTER EAGLES # 3634',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHIGN CENTER EAGLES # 3634' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left contact information - for William - will call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Damian Pulchny at MONKS BAR & GRILL SUN PRAIRIE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MONKS BAR & GRILL SUN PRAIRIE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Damian Pulchny', jsonb_build_array(jsonb_build_object('phone', '(608) 834-3198', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MONKS BAR & GRILL SUN PRAIRIE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Damian Pulchny @ MONKS BAR & GRILL SUN PRAIRIE',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MONKS BAR & GRILL SUN PRAIRIE' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Damian - cheese curds', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Gunnar Koon at MOOSE LODGE OF CARO
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MOOSE LODGE OF CARO' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Gunnar Koon', jsonb_build_array(jsonb_build_object('phone', '(989) 673-2008', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MOOSE LODGE OF CARO' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Gunnar Koon @ MOOSE LODGE OF CARO',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MOOSE LODGE OF CARO' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Sample kit needed to Carol', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Mary Swikle at MARKET 22
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARKET 22' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mary Swikle', jsonb_build_array(jsonb_build_object('phone', '(231) 228-6422', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARKET 22' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mary Swikle @ MARKET 22',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Shela Bingham at MARQUETTE COUNTY MEDICAL CARE FACIL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARQUETTE COUNTY MEDICAL CARE FACIL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Shela Bingham', jsonb_build_array(jsonb_build_object('phone', '(906) 485-1061', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARQUETTE COUNTY MEDICAL CARE FACIL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Shela Bingham @ MARQUETTE COUNTY MEDICAL CARE FACIL',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: kaitlyn mcclary at MARTHAS VINEYARD
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARTHAS VINEYARD' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'kaitlyn mcclary', jsonb_build_array(jsonb_build_object('phone', '(616) 459-0911', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MARTHAS VINEYARD' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'kaitlyn mcclary @ MARTHAS VINEYARD',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bryan Whitmore at MCTI-CULINARY PROGRAM
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MCTI-CULINARY PROGRAM' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bryan Whitmore', jsonb_build_array(jsonb_build_object('phone', '(269) 664-4461', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MCTI-CULINARY PROGRAM' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bryan Whitmore @ MCTI-CULINARY PROGRAM',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Oscar Moreno at MEXO
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MEXO' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Oscar Moreno', jsonb_build_array(jsonb_build_object('phone', '(616) 828-4123', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MEXO' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Oscar Moreno @ MEXO',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Mark Romstadt at Mark''s Diner
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mark''s Diner' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mark Romstadt', jsonb_build_array(jsonb_build_object('phone', '(269) 329-1032', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mark''s Diner' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mark Romstadt @ Mark''s Diner',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mark''s Diner' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Customer requesred samples - sent to Dale at MFB', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Daniel Howe at Milwaukee House  Scoobys Snack Shac
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Milwaukee House  Scoobys Snack Shac' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Daniel Howe', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Milwaukee House  Scoobys Snack Shac' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Daniel Howe @ Milwaukee House  Scoobys Snack Shac',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Milwaukee House  Scoobys Snack Shac' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No contact phone or e-mail', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Andy Linder at Mongo General Store
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mongo General Store' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Andy Linder', jsonb_build_array(jsonb_build_object('phone', '(260) 367-2442', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mongo General Store' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Andy Linder @ Mongo General Store',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mongo General Store' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Andy off today - call back Friday', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Ernie Mason at MICHINDOH CONFERENCE CENTER
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHINDOH CONFERENCE CENTER' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ernie Mason', jsonb_build_array(jsonb_build_object('phone', '(517) 523-3616', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MICHINDOH CONFERENCE CENTER' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ernie Mason @ MICHINDOH CONFERENCE CENTER',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Robert  Hadley at MIDLAND CENTER FOR THE ARTS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MIDLAND CENTER FOR THE ARTS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Robert  Hadley', jsonb_build_array(jsonb_build_object('phone', '(989) 631-5930', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MIDLAND CENTER FOR THE ARTS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Robert  Hadley @ MIDLAND CENTER FOR THE ARTS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: john dyer at Mr.Pibs
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mr.Pibs' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'john dyer', jsonb_build_array(jsonb_build_object('phone', '(231) 768-5288', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mr.Pibs' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'john dyer @ Mr.Pibs',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mr.Pibs' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Ordered 1 cs. of original - get order in the system', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Leigh Sherburne at Murphy''s Bar
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Murphy''s Bar' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Leigh Sherburne', jsonb_build_array(jsonb_build_object('phone', '(989) 382-7466', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Murphy''s Bar' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Leigh Sherburne @ Murphy''s Bar',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Murphy''s Bar' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call Leigh back at 5:00 PM tonight', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Gunnar Koon at MOOSE LODGE OF CARO
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MOOSE LODGE OF CARO' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Gunnar Koon', jsonb_build_array(jsonb_build_object('phone', '(989) 673-2008', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MOOSE LODGE OF CARO' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Gunnar Koon @ MOOSE LODGE OF CARO',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Mellisa Spinella at MORRISON LAKE GOLF CLUB
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MORRISON LAKE GOLF CLUB' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mellisa Spinella', jsonb_build_array(jsonb_build_object('phone', '(616) 207-9060', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MORRISON LAKE GOLF CLUB' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mellisa Spinella @ MORRISON LAKE GOLF CLUB',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Nathan  Holben at MR BURGER #1
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MR BURGER #1' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Nathan  Holben', jsonb_build_array(jsonb_build_object('phone', '(616) 453-6291', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MR BURGER #1' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Nathan  Holben @ MR BURGER #1',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Rajeev Patgaonkar at MSU FOOD STORES PM PALLET DELIVERY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MSU FOOD STORES PM PALLET DELIVERY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Rajeev Patgaonkar', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'MSU FOOD STORES PM PALLET DELIVERY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Rajeev Patgaonkar @ MSU FOOD STORES PM PALLET DELIVERY',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jorge Mendez at Mangiamos
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mangiamos' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jorge Mendez', jsonb_build_array(jsonb_build_object('phone', '(616) 742-0600', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mangiamos' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jorge Mendez @ Mangiamos',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Manny Sanchez at Manny''s Dream Kitchen
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Manny''s Dream Kitchen' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Manny Sanchez', jsonb_build_array(jsonb_build_object('phone', '(260) 409-7474', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Manny''s Dream Kitchen' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Manny Sanchez @ Manny''s Dream Kitchen',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Marcus Powers at Marcus Powers
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Marcus Powers' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Marcus Powers', jsonb_build_array(jsonb_build_object('phone', '(832) 389-5198', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Marcus Powers' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Marcus Powers @ Marcus Powers',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Josh Simmer at NORTHCREST ASSISTED LIVING COMMUNIT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTHCREST ASSISTED LIVING COMMUNIT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Josh Simmer', jsonb_build_array(jsonb_build_object('phone', '(231) 744-2447', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTHCREST ASSISTED LIVING COMMUNIT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Josh Simmer @ NORTHCREST ASSISTED LIVING COMMUNIT',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTHCREST ASSISTED LIVING COMMUNIT' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Josh  - he is calling me back today', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Alex Mantakounis at Mega Bev GR29 LLC
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mega Bev GR29 LLC' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alex Mantakounis', jsonb_build_array(jsonb_build_object('phone', '(616) 942-2980', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Mega Bev GR29 LLC' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alex Mantakounis @ Mega Bev GR29 LLC',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Heather Shephard at Miles Market
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Miles Market' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Heather Shephard', jsonb_build_array(jsonb_build_object('phone', '(989) 374-3900', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Miles Market' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Heather Shephard @ Miles Market',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Casie Bartlett at Miles Market
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Miles Market' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Casie Bartlett', jsonb_build_array(jsonb_build_object('phone', '(989) 374-3900', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Miles Market' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Casie Bartlett @ Miles Market',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Nicholas Allen at Nicos Pub and Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Nicos Pub and Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Nicholas Allen', jsonb_build_array(jsonb_build_object('phone', '(517) 235-7101', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Nicos Pub and Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Nicholas Allen @ Nicos Pub and Grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Nicos Pub and Grill' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back at 12:35 PM today.', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Karim Tinoco at Notre Dame-General Acct
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Notre Dame-General Acct' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Karim Tinoco', jsonb_build_array(jsonb_build_object('phone', '(574) 631-5000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Notre Dame-General Acct' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Karim Tinoco @ Notre Dame-General Acct',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Notre Dame-General Acct' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'No fryer - possible to provide for agreement?', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Dan Gorman at Montague High School
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Montague High School' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dan Gorman', jsonb_build_array(jsonb_build_object('phone', '(231) 894-2661', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Montague High School' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dan Gorman @ Montague High School',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tracy  Dinsmore at OGEMAW COMMISSION ON AGING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OGEMAW COMMISSION ON AGING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tracy  Dinsmore', jsonb_build_array(jsonb_build_object('phone', '(989) 345-3010', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OGEMAW COMMISSION ON AGING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tracy  Dinsmore @ OGEMAW COMMISSION ON AGING',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Brian Lonberg at Old Mill Brewpub & Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Old Mill Brewpub & Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brian Lonberg', jsonb_build_array(jsonb_build_object('phone', '(269) 204-6601', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Old Mill Brewpub & Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brian Lonberg @ Old Mill Brewpub & Grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Old Mill Brewpub & Grill' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Customer requesred larger ranch sample - sent to Dale at MFB', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Matt Barbera at PENINSULA GRILL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PENINSULA GRILL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matt Barbera', jsonb_build_array(jsonb_build_object('phone', '(231) 223-7200', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PENINSULA GRILL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matt Barbera @ PENINSULA GRILL',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PENINSULA GRILL' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Got samples - owners keeping currnet cheese items', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: A Mclovin at Muskegon Country Club
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Muskegon Country Club' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'A Mclovin', jsonb_build_array(jsonb_build_object('phone', '(231) 755-3737', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Muskegon Country Club' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'A Mclovin @ Muskegon Country Club',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Nate Dobbins at NAPOLEON RESTAURANT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NAPOLEON RESTAURANT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Nate Dobbins', jsonb_build_array(jsonb_build_object('phone', '(517) 536-4244', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NAPOLEON RESTAURANT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Nate Dobbins @ NAPOLEON RESTAURANT',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jeff Brown at NEDS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NEDS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jeff Brown', jsonb_build_array(jsonb_build_object('phone', '(269) 671-5700', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NEDS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jeff Brown @ NEDS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Derek  Estes at NMU / UC  CATERING FOOD
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NMU / UC  CATERING FOOD' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Derek  Estes', jsonb_build_array(jsonb_build_object('phone', '(906) 227-2520', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NMU / UC  CATERING FOOD' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Derek  Estes @ NMU / UC  CATERING FOOD',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Mattie Smith at NORTH WOODS NURSING CENTER
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTH WOODS NURSING CENTER' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mattie Smith', jsonb_build_array(jsonb_build_object('phone', '(989) 588-9928', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTH WOODS NURSING CENTER' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mattie Smith @ NORTH WOODS NURSING CENTER',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Mattie Smith at NORTH WOODS NURSING CENTER
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTH WOODS NURSING CENTER' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mattie Smith', jsonb_build_array(jsonb_build_object('phone', '(989) 588-9928', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTH WOODS NURSING CENTER' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mattie Smith @ NORTH WOODS NURSING CENTER',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: matt bunyan at PORTSIDE PIZZA- COLUMBIA CITY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PORTSIDE PIZZA- COLUMBIA CITY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'matt bunyan', jsonb_build_array(jsonb_build_object('phone', '(260) 691-3333', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PORTSIDE PIZZA- COLUMBIA CITY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'matt bunyan @ PORTSIDE PIZZA- COLUMBIA CITY',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PORTSIDE PIZZA- COLUMBIA CITY' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back for Matt - 4:30 PM 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jan Jager at NORTHVIEW PUBLIC SCHOOL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTHVIEW PUBLIC SCHOOL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jan Jager', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'NORTHVIEW PUBLIC SCHOOL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jan Jager @ NORTHVIEW PUBLIC SCHOOL',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Samantha Clinkscale at New Mancinos Big Rapids
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'New Mancinos Big Rapids' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Samantha Clinkscale', jsonb_build_array(jsonb_build_object('phone', '(231) 796-6666', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'New Mancinos Big Rapids' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Samantha Clinkscale @ New Mancinos Big Rapids',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Alana Matyas-Brower at Pigeon Hill Brewing Company
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pigeon Hill Brewing Company' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alana Matyas-Brower', jsonb_build_array(jsonb_build_object('phone', '(231) 375-5184', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pigeon Hill Brewing Company' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alana Matyas-Brower @ Pigeon Hill Brewing Company',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pigeon Hill Brewing Company' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Operator took my contact infomration - gave to Alana', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Courtney Beluzar at Pincrest Bar & Lanes
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pincrest Bar & Lanes' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Courtney Beluzar', jsonb_build_array(jsonb_build_object('phone', '(231) 865-3215', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pincrest Bar & Lanes' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Courtney Beluzar @ Pincrest Bar & Lanes',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pincrest Bar & Lanes' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Sarah took my contact infomration - gave to Courtney', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: James Stanton at Northside Senior Center
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Northside Senior Center' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'James Stanton', jsonb_build_array(jsonb_build_object('phone', '(231) 547-5361', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Northside Senior Center' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'James Stanton @ Northside Senior Center',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jake  Eigenheer at Notre Dame-110 South Dining Hall
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Notre Dame-110 South Dining Hall' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jake  Eigenheer', jsonb_build_array(jsonb_build_object('phone', '(574) 631-7253', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Notre Dame-110 South Dining Hall' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jake  Eigenheer @ Notre Dame-110 South Dining Hall',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Katrina Carpenter at Piper’s Grinders Galore
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Piper’s Grinders Galore' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Katrina Carpenter', jsonb_build_array(jsonb_build_object('phone', '(269) 435-7115', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Piper’s Grinders Galore' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Katrina Carpenter @ Piper’s Grinders Galore',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Piper’s Grinders Galore' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Katrina is creating test batch - f/u next week', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Cheryl Bauer at Notre Dame-General Acct
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Notre Dame-General Acct' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cheryl Bauer', jsonb_build_array(jsonb_build_object('phone', '(574) 631-5000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Notre Dame-General Acct' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cheryl Bauer @ Notre Dame-General Acct',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Nioka Mitchell at OAKWOOD RESORT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OAKWOOD RESORT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Nioka Mitchell', jsonb_build_array(jsonb_build_object('phone', '(574) 457-7100', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OAKWOOD RESORT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Nioka Mitchell @ OAKWOOD RESORT',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Lynne Daniels at RIPPLING RAPIDS GOLF COURSE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RIPPLING RAPIDS GOLF COURSE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lynne Daniels', jsonb_build_array(jsonb_build_object('phone', '(231) 625-2770', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RIPPLING RAPIDS GOLF COURSE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lynne Daniels @ RIPPLING RAPIDS GOLF COURSE',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RIPPLING RAPIDS GOLF COURSE' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Brock Webb at OMH-BROWNING MASONIC COMMUNITY 6452 (100026751)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OMH-BROWNING MASONIC COMMUNITY 6452 (100026751)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brock Webb', jsonb_build_array(jsonb_build_object('phone', '(419) 878-4055', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OMH-BROWNING MASONIC COMMUNITY 6452 (100026751)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brock Webb @ OMH-BROWNING MASONIC COMMUNITY 6452 (100026751)',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jenee Asper at ORCHARD CREEK SUPPORTIVE CARE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ORCHARD CREEK SUPPORTIVE CARE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jenee Asper', jsonb_build_array(jsonb_build_object('phone', '(231) 932-9020', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'ORCHARD CREEK SUPPORTIVE CARE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jenee Asper @ ORCHARD CREEK SUPPORTIVE CARE',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Richard Jewell at OTSEGO CLUB FOOD AND BEVERAGE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OTSEGO CLUB FOOD AND BEVERAGE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Richard Jewell', jsonb_build_array(jsonb_build_object('phone', '(989) 732-5181', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OTSEGO CLUB FOOD AND BEVERAGE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Richard Jewell @ OTSEGO CLUB FOOD AND BEVERAGE',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tory Thompson at OTTAWA COUNTY SENIOR RESOURCE 20226
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OTTAWA COUNTY SENIOR RESOURCE 20226' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tory Thompson', jsonb_build_array(jsonb_build_object('phone', '(419) 898-6459', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'OTTAWA COUNTY SENIOR RESOURCE 20226' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tory Thompson @ OTTAWA COUNTY SENIOR RESOURCE 20226',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Theresa Jacobs at THS-Trinity Grand Haven-H052340
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THS-Trinity Grand Haven-H052340' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Theresa Jacobs', jsonb_build_array(jsonb_build_object('phone', '(616) 842-3600', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THS-Trinity Grand Haven-H052340' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Theresa Jacobs @ THS-Trinity Grand Haven-H052340',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THS-Trinity Grand Haven-H052340' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: JD Haughey at The Featherbone Restaurant & Lounge
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Featherbone Restaurant & Lounge' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'JD Haughey', jsonb_build_array(jsonb_build_object('phone', '(269) 756-6821', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Featherbone Restaurant & Lounge' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'JD Haughey @ The Featherbone Restaurant & Lounge',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Featherbone Restaurant & Lounge' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'JD will call back 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: MIchele Murphy Wise at PINES VILLAGE RETIREMENT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PINES VILLAGE RETIREMENT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'MIchele Murphy Wise', jsonb_build_array(jsonb_build_object('phone', '(219) 465-1591', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'PINES VILLAGE RETIREMENT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'MIchele Murphy Wise @ PINES VILLAGE RETIREMENT',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ben Longstreet at The Wooden Shoe
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Wooden Shoe' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ben Longstreet', jsonb_build_array(jsonb_build_object('phone', '(616) 396-4744', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Wooden Shoe' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ben Longstreet @ The Wooden Shoe',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Wooden Shoe' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jesse Foerch at Papa Chops Eatery
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Papa Chops Eatery' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jesse Foerch', jsonb_build_array(jsonb_build_object('phone', '(616) 284-8800', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Papa Chops Eatery' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jesse Foerch @ Papa Chops Eatery',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kristy Cordts at Pasadena Villa Great Lakes
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pasadena Villa Great Lakes' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kristy Cordts', jsonb_build_array(jsonb_build_object('phone', '(269) 224-4047', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pasadena Villa Great Lakes' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kristy Cordts @ Pasadena Villa Great Lakes',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Pat Truresdale at Paw Paw Township Senior Center
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Paw Paw Township Senior Center' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Pat Truresdale', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Paw Paw Township Senior Center' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Pat Truresdale @ Paw Paw Township Senior Center',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Pat Truresdale at Paw Paw Township Senior Center
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Paw Paw Township Senior Center' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Pat Truresdale', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Paw Paw Township Senior Center' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Pat Truresdale @ Paw Paw Township Senior Center',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kelly Cook at Perennial Park
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Perennial Park' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kelly Cook', jsonb_build_array(jsonb_build_object('phone', '(517) 437-2422', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Perennial Park' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kelly Cook @ Perennial Park',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: katy test at Perenso Test
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Perenso Test' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'katy test', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Perenso Test' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'katy test @ Perenso Test',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: katy test at Perenso Test
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Perenso Test' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'katy test', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Perenso Test' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'katy test @ Perenso Test',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Scott Paliga at Pig-N-Pizza
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pig-N-Pizza' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Scott Paliga', jsonb_build_array(jsonb_build_object('phone', '(269) 244-9915', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pig-N-Pizza' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Scott Paliga @ Pig-N-Pizza',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Gerard Macri at VILLA MACRI
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VILLA MACRI' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Gerard Macri', jsonb_build_array(jsonb_build_object('phone', '(574) 277-7273', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VILLA MACRI' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Gerard Macri @ VILLA MACRI',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VILLA MACRI' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gerald out unitl 11/7 - call back', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Ben Konowitz at Pin Fusion
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pin Fusion' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ben Konowitz', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pin Fusion' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ben Konowitz @ Pin Fusion',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Danny Kreighbaum at White Horse Saloon
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'White Horse Saloon' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Danny Kreighbaum', jsonb_build_array(jsonb_build_object('phone', '(219) 767-5055', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'White Horse Saloon' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Danny Kreighbaum @ White Horse Saloon',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'White Horse Saloon' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Paula Danville at Pine Haven Senior Assisted Living
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pine Haven Senior Assisted Living' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Paula Danville', jsonb_build_array(jsonb_build_object('phone', '(989) 295-6632', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pine Haven Senior Assisted Living' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Paula Danville @ Pine Haven Senior Assisted Living',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Delon Barry at Pine Rest Christian Mental Health S
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pine Rest Christian Mental Health S' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Delon Barry', jsonb_build_array(jsonb_build_object('phone', '(616) 281-0061', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pine Rest Christian Mental Health S' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Delon Barry @ Pine Rest Christian Mental Health S',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Karsyn Coley at Woodshed Tap
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Woodshed Tap' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Karsyn Coley', jsonb_build_array(jsonb_build_object('phone', '(574) 772-2422', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Woodshed Tap' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Karsyn Coley @ Woodshed Tap',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Woodshed Tap' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Gary', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jack Blesch at BOWENS RESTAURANT
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BOWENS RESTAURANT' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jack Blesch', jsonb_build_array(jsonb_build_object('phone', '(269) 623-8500', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BOWENS RESTAURANT' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jack Blesch @ BOWENS RESTAURANT',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BOWENS RESTAURANT' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Sold original', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jason  Perkins at Pizza Man
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pizza Man' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jason  Perkins', jsonb_build_array(jsonb_build_object('phone', '(989) 465-1142', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pizza Man' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jason  Perkins @ Pizza Man',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ben Walker at BUCKS RUN GOLF CLUB
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BUCKS RUN GOLF CLUB' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ben Walker', jsonb_build_array(jsonb_build_object('phone', '(989) 773-6830', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BUCKS RUN GOLF CLUB' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ben Walker @ BUCKS RUN GOLF CLUB',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'BUCKS RUN GOLF CLUB' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message - fdsvc mgr. - call back 11/7', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: CAITLYN SCHER at Powers Health - St Mary Med Food Se
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Powers Health - St Mary Med Food Se' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'CAITLYN SCHER', jsonb_build_array(jsonb_build_object('phone', '(219) 942-0551', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Powers Health - St Mary Med Food Se' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'CAITLYN SCHER @ Powers Health - St Mary Med Food Se',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Lisa  McCoy at GS- Peabody Retirement Community
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GS- Peabody Retirement Community' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lisa  McCoy', jsonb_build_array(jsonb_build_object('phone', '(260) 982-8616', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GS- Peabody Retirement Community' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lisa  McCoy @ GS- Peabody Retirement Community',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'GS- Peabody Retirement Community' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Will order the orig,/ garlic and ranch.', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Maggie Thiel at RAILSIDE LIVING CENTER
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RAILSIDE LIVING CENTER' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Maggie Thiel', jsonb_build_array(jsonb_build_object('phone', '(616) 878-4620', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RAILSIDE LIVING CENTER' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Maggie Thiel @ RAILSIDE LIVING CENTER',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: NATHANIEL MALONE at RDX CREATIVE DINING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RDX CREATIVE DINING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'NATHANIEL MALONE', jsonb_build_array(jsonb_build_object('phone', '(616) 748-1700', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RDX CREATIVE DINING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'NATHANIEL MALONE @ RDX CREATIVE DINING',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: NATHANIEL MALONE at RDX CREATIVE DINING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RDX CREATIVE DINING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'NATHANIEL MALONE', jsonb_build_array(jsonb_build_object('phone', '(616) 748-1700', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RDX CREATIVE DINING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'NATHANIEL MALONE @ RDX CREATIVE DINING',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Crystal Hallwood at REAL SERVICES/NUTRITION
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'REAL SERVICES/NUTRITION' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Crystal Hallwood', jsonb_build_array(jsonb_build_object('phone', '(574) 291-5597', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'REAL SERVICES/NUTRITION' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Crystal Hallwood @ REAL SERVICES/NUTRITION',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kyle Housand at REST HAVEN HOMES
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'REST HAVEN HOMES' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kyle Housand', jsonb_build_array(jsonb_build_object('phone', '(616) 363-6819', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'REST HAVEN HOMES' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kyle Housand @ REST HAVEN HOMES',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tony O''Berry at RINALDI PIZZA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RINALDI PIZZA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tony O''Berry', jsonb_build_array(jsonb_build_object('phone', '(616) 677-1281', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RINALDI PIZZA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tony O''Berry @ RINALDI PIZZA',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Paula Moomey at HOUSEMAN''S FOODS WHITE CLOUD
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HOUSEMAN''S FOODS WHITE CLOUD' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Paula Moomey', jsonb_build_array(jsonb_build_object('phone', '(231) 689-1280', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HOUSEMAN''S FOODS WHITE CLOUD' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Paula Moomey @ HOUSEMAN''S FOODS WHITE CLOUD',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'HOUSEMAN''S FOODS WHITE CLOUD' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Ordered 2 Ranch & Garlic items. ( Phi advice GFS rep)', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: CHOLONNI MADISON at RIVER VALLEY
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RIVER VALLEY' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'CHOLONNI MADISON', jsonb_build_array(jsonb_build_object('phone', '(616) 787-7481', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RIVER VALLEY' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'CHOLONNI MADISON @ RIVER VALLEY',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Christine rudd at Hoffman Street Grocery
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hoffman Street Grocery' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Christine rudd', jsonb_build_array(jsonb_build_object('phone', '(269) 279-2510', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hoffman Street Grocery' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Christine rudd @ Hoffman Street Grocery',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Hoffman Street Grocery' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Customer orderd ranch & jalapeno', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: karLee larabee at Ravenna Pub
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ravenna Pub' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'karLee larabee', jsonb_build_array(jsonb_build_object('phone', '(231) 853-6945', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ravenna Pub' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'karLee larabee @ Ravenna Pub',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: carolyn jurecki at Ravenna Pub
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ravenna Pub' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'carolyn jurecki', jsonb_build_array(jsonb_build_object('phone', '(231) 853-6945', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ravenna Pub' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'carolyn jurecki @ Ravenna Pub',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kevin Peterson at Red Brick Tap & Barrel
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Red Brick Tap & Barrel' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kevin Peterson', jsonb_build_array(jsonb_build_object('phone', '(989) 340-2175', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Red Brick Tap & Barrel' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kevin Peterson @ Red Brick Tap & Barrel',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Larry Flickinger at Rehabilitation Hosp Northern IN-H06
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Rehabilitation Hosp Northern IN-H06' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Larry Flickinger', jsonb_build_array(jsonb_build_object('phone', '(574) 243-7727', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Rehabilitation Hosp Northern IN-H06' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Larry Flickinger @ Rehabilitation Hosp Northern IN-H06',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Scott Meekhof at Resthaven - The Farmstead
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Resthaven - The Farmstead' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Scott Meekhof', jsonb_build_array(jsonb_build_object('phone', '(616) 796-3888', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Resthaven - The Farmstead' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Scott Meekhof @ Resthaven - The Farmstead',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Gabrielle  Howard at Revel Center
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Revel Center' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Gabrielle  Howard', jsonb_build_array(jsonb_build_object('phone', '(616) 202-6524', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Revel Center' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Gabrielle  Howard @ Revel Center',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Harold Klukowski at Northfield Lanes Plainfield
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Northfield Lanes Plainfield' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Harold Klukowski', jsonb_build_array(jsonb_build_object('phone', '(616) 363-0003', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Northfield Lanes Plainfield' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Harold Klukowski @ Northfield Lanes Plainfield',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Northfield Lanes Plainfield' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'ordered 1 cs of garlic curds', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Michael Taylor at River House Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'River House Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Michael Taylor', jsonb_build_array(jsonb_build_object('phone', '(517) 647-4400', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'River House Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Michael Taylor @ River House Grill',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Catrina Naranjo at Pizza Man
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pizza Man' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Catrina Naranjo', jsonb_build_array(jsonb_build_object('phone', '(989) 465-1142', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pizza Man' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Catrina Naranjo @ Pizza Man',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Pizza Man' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Catrina on vacation - call Bob next Wednesday.', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jamie Clark at Roasted
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Roasted' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jamie Clark', jsonb_build_array(jsonb_build_object('phone', '(616) 381-2000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Roasted' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jamie Clark @ Roasted',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Aveon Jones at Romulus Community Schools
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Romulus Community Schools' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Aveon Jones', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Romulus Community Schools' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Aveon Jones @ Romulus Community Schools',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ryan Santellan at Ryan Santellan
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ryan Santellan' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ryan Santellan', jsonb_build_array(jsonb_build_object('phone', '(713) 629-0090', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Ryan Santellan' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ryan Santellan @ Ryan Santellan',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Henry Ditmar at SALT OF THE EARTH
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SALT OF THE EARTH' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Henry Ditmar', jsonb_build_array(jsonb_build_object('phone', '(269) 561-7258', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SALT OF THE EARTH' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Henry Ditmar @ SALT OF THE EARTH',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Sean Porter at Porters Smokehouse
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Porters Smokehouse' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Sean Porter', jsonb_build_array(jsonb_build_object('phone', '(616) 294-2513', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Porters Smokehouse' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Sean Porter @ Porters Smokehouse',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Porters Smokehouse' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Put 1 case of original for next Thursday -', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jennifer Elwood at RUSH CREEK BISTRO AT SUNNYBROOK CC
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RUSH CREEK BISTRO AT SUNNYBROOK CC' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jennifer Elwood', jsonb_build_array(jsonb_build_object('phone', '(616) 457-1100', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RUSH CREEK BISTRO AT SUNNYBROOK CC' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jennifer Elwood @ RUSH CREEK BISTRO AT SUNNYBROOK CC',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'RUSH CREEK BISTRO AT SUNNYBROOK CC' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'E-mail Jennifer - jelwood@redwater restaurants.com', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Ryan Cox at SLEDERS FAMILY TAVERN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SLEDERS FAMILY TAVERN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ryan Cox', jsonb_build_array(jsonb_build_object('phone', '(231) 947-9213', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SLEDERS FAMILY TAVERN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ryan Cox @ SLEDERS FAMILY TAVERN',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Cole Schafer at Railside Golf Club
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Railside Golf Club' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cole Schafer', jsonb_build_array(jsonb_build_object('phone', '(616) 878-1140', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Railside Golf Club' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cole Schafer @ Railside Golf Club',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Railside Golf Club' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Left message for Cole.', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Rob Miller at Rip''s
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Rip''s' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Rob Miller', jsonb_build_array(jsonb_build_object('phone', '(815) 894-3051', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Rip''s' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Rob Miller @ Rip''s',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Rip''s' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back Monday 10/11', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Joe  Jarvis at River Raisin Distillery
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'River Raisin Distillery' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Joe  Jarvis', jsonb_build_array(jsonb_build_object('phone', '(734) 212-3246', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'River Raisin Distillery' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Joe  Jarvis @ River Raisin Distillery',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'River Raisin Distillery' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Have samples - will order a case of bakeable', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Karly volk at SANDY PINES SPORTS BAR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SANDY PINES SPORTS BAR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Karly volk', jsonb_build_array(jsonb_build_object('phone', '(219) 987-3674', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SANDY PINES SPORTS BAR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Karly volk @ SANDY PINES SPORTS BAR',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SANDY PINES SPORTS BAR' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Already order weekly - 3 flavors', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Jennifer Sweney at SULLIVAN''S
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SULLIVAN''S' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jennifer Sweney', jsonb_build_array(jsonb_build_object('phone', '(989) 799-1940', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SULLIVAN''S' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jennifer Sweney @ SULLIVAN''S',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Ian Yore at SILVER BEACH PIZZA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SILVER BEACH PIZZA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ian Yore', jsonb_build_array(jsonb_build_object('phone', '(269) 983-4743', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SILVER BEACH PIZZA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ian Yore @ SILVER BEACH PIZZA',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SILVER BEACH PIZZA' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Busy now -call back Monday PM', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Dennis  Wagner at Shanty Creek Resort - Summit Villag
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shanty Creek Resort - Summit Villag' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Dennis  Wagner', jsonb_build_array(jsonb_build_object('phone', '(866) 486-7790', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shanty Creek Resort - Summit Villag' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Dennis  Wagner @ Shanty Creek Resort - Summit Villag',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bobby Chanthalangsy at SLEDERS FAMILY TAVERN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SLEDERS FAMILY TAVERN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bobby Chanthalangsy', jsonb_build_array(jsonb_build_object('phone', '(231) 947-9213', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SLEDERS FAMILY TAVERN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bobby Chanthalangsy @ SLEDERS FAMILY TAVERN',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SLEDERS FAMILY TAVERN' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Bobby left - back at 5:00 -  call back at that time.', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Ed Postma at SNACK SHACK 2 (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SNACK SHACK 2 (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ed Postma', jsonb_build_array(jsonb_build_object('phone', '(269) 205-2828', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SNACK SHACK 2 (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ed Postma @ SNACK SHACK 2 (THE)',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SNACK SHACK 2 (THE)' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call back Monday AM', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Josh Decker at SPRINGS (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SPRINGS (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Josh Decker', jsonb_build_array(jsonb_build_object('phone', '(989) 426-7604', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SPRINGS (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Josh Decker @ SPRINGS (THE)',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SPRINGS (THE)' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Order 1 case of bakeable - Call back December  for marriage and family seminar', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: David Barbour at Socibowl
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Socibowl' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'David Barbour', jsonb_build_array(jsonb_build_object('phone', '(231) 769-2969', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Socibowl' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'David Barbour @ Socibowl',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Alissa Cox - Chef Allissa at SPRINGVALE ASSISTED LIVING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SPRINGVALE ASSISTED LIVING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alissa Cox - Chef Allissa', jsonb_build_array(jsonb_build_object('phone', '(810) 230-6644', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SPRINGVALE ASSISTED LIVING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alissa Cox - Chef Allissa @ SPRINGVALE ASSISTED LIVING',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'SPRINGVALE ASSISTED LIVING' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Call after 6:00 PM', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: dawn polley at Sparrow Hospital
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Sparrow Hospital' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'dawn polley', jsonb_build_array(jsonb_build_object('phone', '(517) 364-1000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Sparrow Hospital' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'dawn polley @ Sparrow Hospital',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Brock Bush at STUDIO C - CELEBRATION CINEMA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'STUDIO C - CELEBRATION CINEMA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Brock Bush', jsonb_build_array(jsonb_build_object('phone', '(517) 381-8100', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'STUDIO C - CELEBRATION CINEMA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Brock Bush @ STUDIO C - CELEBRATION CINEMA',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'STUDIO C - CELEBRATION CINEMA' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Out until Monday 11/10 - call then', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Michael Rhadigan at St Ambrose Church
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'St Ambrose Church' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Michael Rhadigan', jsonb_build_array(jsonb_build_object('phone', '(313) 822-2814', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'St Ambrose Church' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Michael Rhadigan @ St Ambrose Church',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Missy  Shelhart at Sawd''s Village Inn
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Sawd''s Village Inn' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Missy  Shelhart', jsonb_build_array(jsonb_build_object('phone', '(517) 926-6099', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Sawd''s Village Inn' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Missy  Shelhart @ Sawd''s Village Inn',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Sawd''s Village Inn' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Monday - call at 9:00 AM', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Heather Harrold at Shigs in Pit - Maplecrest 3711784E
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shigs in Pit - Maplecrest 3711784E' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Heather Harrold', jsonb_build_array(jsonb_build_object('phone', '(260) 222-8802', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shigs in Pit - Maplecrest 3711784E' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Heather Harrold @ Shigs in Pit - Maplecrest 3711784E',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shigs in Pit - Maplecrest 3711784E' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'y', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Meghan Shaw at Street Beet
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Street Beet' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Meghan Shaw', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Street Beet' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Meghan Shaw @ Street Beet',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Victor  Rodriguez Hidalgo at Street Fare - LaFortune Student Center
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Street Fare - LaFortune Student Center' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Victor  Rodriguez Hidalgo', jsonb_build_array(jsonb_build_object('phone', '(574) 631-8128', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Street Fare - LaFortune Student Center' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Victor  Rodriguez Hidalgo @ Street Fare - LaFortune Student Center',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Elijah Shoemaker at Shoeys Log Bar
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shoeys Log Bar' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Elijah Shoemaker', jsonb_build_array(jsonb_build_object('phone', '(231) 338-3083', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shoeys Log Bar' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Elijah Shoemaker @ Shoeys Log Bar',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Shoeys Log Bar' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Need sample case - send next week GFS rep to send.  Call next week to check in - like them?', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Leon Thompson at Smuggler At North Shore
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Smuggler At North Shore' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Leon Thompson', jsonb_build_array(jsonb_build_object('phone', '(231) 237-8286', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Smuggler At North Shore' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Leon Thompson @ Smuggler At North Shore',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Smuggler At North Shore' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Reanne back on Monday', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Ryan Peterson at South Haven Dairy Bar
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'South Haven Dairy Bar' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Ryan Peterson', jsonb_build_array(jsonb_build_object('phone', '(269) 637-8251', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'South Haven Dairy Bar' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Ryan Peterson @ South Haven Dairy Bar',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Antoine  Skyes at THREE BLONDES BREWING
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THREE BLONDES BREWING' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Antoine  Skyes', jsonb_build_array(jsonb_build_object('phone', '(269) 872-3911', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THREE BLONDES BREWING' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Antoine  Skyes @ THREE BLONDES BREWING',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Lynn Driscoll at Sparta Lanes
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Sparta Lanes' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lynn Driscoll', jsonb_build_array(jsonb_build_object('phone', '(616) 887-9951', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Sparta Lanes' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lynn Driscoll @ Sparta Lanes',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Lynette  Fields at THS-SANCTUARY AT MARYCREST MANOR-H0
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THS-SANCTUARY AT MARYCREST MANOR-H0' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Lynette  Fields', jsonb_build_array(jsonb_build_object('phone', '(734) 743-4000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THS-SANCTUARY AT MARYCREST MANOR-H0' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Lynette  Fields @ THS-SANCTUARY AT MARYCREST MANOR-H0',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: joseph stalec at Stans Bar
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Stans Bar' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'joseph stalec', jsonb_build_array(jsonb_build_object('phone', '(616) 842-1553', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Stans Bar' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'joseph stalec @ Stans Bar',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Chris Glisson at TIM''S TOO
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TIM''S TOO' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Chris Glisson', jsonb_build_array(jsonb_build_object('phone', '(269) 985-0094', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TIM''S TOO' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Chris Glisson @ TIM''S TOO',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Matt Hoffman at TIMBERS BAR & GRILL
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TIMBERS BAR & GRILL' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matt Hoffman', jsonb_build_array(jsonb_build_object('phone', '(989) 790-2345', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TIMBERS BAR & GRILL' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matt Hoffman @ TIMBERS BAR & GRILL',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Cassie  Demaestri at State Street Dairy
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'State Street Dairy' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cassie  Demaestri', jsonb_build_array(jsonb_build_object('phone', '(989) 733-2515', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'State Street Dairy' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cassie  Demaestri @ State Street Dairy',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jason Biega at TRACEY''S AT ROAM INN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TRACEY''S AT ROAM INN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jason Biega', jsonb_build_array(jsonb_build_object('phone', '(906) 387-8000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TRACEY''S AT ROAM INN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jason Biega @ TRACEY''S AT ROAM INN',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kelly  Nelson at TRADEWINDS RESTAURANT MISHAWAKA
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TRADEWINDS RESTAURANT MISHAWAKA' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kelly  Nelson', jsonb_build_array(jsonb_build_object('phone', '(574) 258-0830', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TRADEWINDS RESTAURANT MISHAWAKA' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kelly  Nelson @ TRADEWINDS RESTAURANT MISHAWAKA',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Atiba Hodges  Atiba Hodges at TRILOGY-BATTLE CREEK-OAKS AT NORTHP
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TRILOGY-BATTLE CREEK-OAKS AT NORTHP' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Atiba Hodges  Atiba Hodges', jsonb_build_array(jsonb_build_object('phone', '(269) 964-4655', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TRILOGY-BATTLE CREEK-OAKS AT NORTHP' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Atiba Hodges  Atiba Hodges @ TRILOGY-BATTLE CREEK-OAKS AT NORTHP',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: aaron hedger at TERRY''S WOODBURY CAFE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TERRY''S WOODBURY CAFE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'aaron hedger', jsonb_build_array(jsonb_build_object('phone', '(616) 841-1654', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TERRY''S WOODBURY CAFE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'aaron hedger @ TERRY''S WOODBURY CAFE',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tyler Nutt at THIRSTY STURGEON (THE)
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THIRSTY STURGEON (THE)' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tyler Nutt', jsonb_build_array(jsonb_build_object('phone', '(231) 525-9151', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THIRSTY STURGEON (THE)' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tyler Nutt @ THIRSTY STURGEON (THE)',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tiffany Hagerman at THORNAPPLE MANOR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THORNAPPLE MANOR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tiffany Hagerman', jsonb_build_array(jsonb_build_object('phone', '(269) 945-2407', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THORNAPPLE MANOR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tiffany Hagerman @ THORNAPPLE MANOR',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Sam Bristol at THREE BRIDGES DISTILLERY AND TAPROO
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THREE BRIDGES DISTILLERY AND TAPROO' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Sam Bristol', jsonb_build_array(jsonb_build_object('phone', '(989) 423-1533', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'THREE BRIDGES DISTILLERY AND TAPROO' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Sam Bristol @ THREE BRIDGES DISTILLERY AND TAPROO',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jim Noel at TOP SHELF PIZZA & PUB
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TOP SHELF PIZZA & PUB' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jim Noel', jsonb_build_array(jsonb_build_object('phone', '(231) 773-4444', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TOP SHELF PIZZA & PUB' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jim Noel @ TOP SHELF PIZZA & PUB',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Paul Ballard at The Finish Line Family Restaurant
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Finish Line Family Restaurant' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Paul Ballard', jsonb_build_array(jsonb_build_object('phone', '(517) 437-3470', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Finish Line Family Restaurant' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Paul Ballard @ The Finish Line Family Restaurant',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Aaron Haight at TWO HATS RANCH
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TWO HATS RANCH' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Aaron Haight', jsonb_build_array(jsonb_build_object('phone', '(231) 796-4287', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'TWO HATS RANCH' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Aaron Haight @ TWO HATS RANCH',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tami Smith at The Hotel Frankfort
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Hotel Frankfort' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tami Smith', jsonb_build_array(jsonb_build_object('phone', '(231) 352-8090', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Hotel Frankfort' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tami Smith @ The Hotel Frankfort',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Liz Georges at The Lucky Gnome
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Lucky Gnome' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Liz Georges', jsonb_build_array(jsonb_build_object('phone', '(574) 855-4441', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Lucky Gnome' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Liz Georges @ The Lucky Gnome',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Liz Georges at The Lucky Gnome
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Lucky Gnome' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Liz Georges', jsonb_build_array(jsonb_build_object('phone', '(574) 855-4441', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Lucky Gnome' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Liz Georges @ The Lucky Gnome',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Jason Stickney at Tally Ho BBQ
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Tally Ho BBQ' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Jason Stickney', jsonb_build_array(jsonb_build_object('phone', '(906) 477-4075', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Tally Ho BBQ' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Jason Stickney @ Tally Ho BBQ',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bob  Walsh at Taste Buds
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Taste Buds' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bob  Walsh', '[]'::jsonb, customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Taste Buds' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bob  Walsh @ Taste Buds',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Joe anderson at The Comedy Project
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Comedy Project' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Joe anderson', jsonb_build_array(jsonb_build_object('phone', '(616) 369-7469', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Comedy Project' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Joe anderson @ The Comedy Project',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bryan Lewis at The Village at Pine Valley
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Village at Pine Valley' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bryan Lewis', jsonb_build_array(jsonb_build_object('phone', '(260) 619-4930', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Village at Pine Valley' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bryan Lewis @ The Village at Pine Valley',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bryan Lewis at The Village at Pine Valley
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Village at Pine Valley' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bryan Lewis', jsonb_build_array(jsonb_build_object('phone', '(260) 619-4930', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Village at Pine Valley' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bryan Lewis @ The Village at Pine Valley',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Tom Goodman at The Wildflour
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Wildflour' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Tom Goodman', jsonb_build_array(jsonb_build_object('phone', '(830) 964-2159', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Wildflour' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Tom Goodman @ The Wildflour',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Rachel Smith at The Harrington Inn
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Harrington Inn' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Rachel Smith', jsonb_build_array(jsonb_build_object('phone', '(231) 924-3083', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Harrington Inn' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Rachel Smith @ The Harrington Inn',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Bill Gordon at The curve cafe
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The curve cafe' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Bill Gordon', jsonb_build_array(jsonb_build_object('phone', '(574) 252-5800', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The curve cafe' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Bill Gordon @ The curve cafe',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: valerie devaney at The Rubber Duck
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Rubber Duck' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'valerie devaney', jsonb_build_array(jsonb_build_object('phone', '(586) 477-0556', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Rubber Duck' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'valerie devaney @ The Rubber Duck',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Chasity  Huntington at Time Out Campground
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Time Out Campground' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Chasity  Huntington', jsonb_build_array(jsonb_build_object('phone', '(902) 756-3220', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Time Out Campground' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Chasity  Huntington @ Time Out Campground',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Patty Gray at The Tavern on 223
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Tavern on 223' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Patty Gray', jsonb_build_array(jsonb_build_object('phone', '(517) 467-2232', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Tavern on 223' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Patty Gray @ The Tavern on 223',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Heather  Courtois at The Village At Inverness
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Village At Inverness' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Heather  Courtois', jsonb_build_array(jsonb_build_object('phone', '(260) 619-4956', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The Village At Inverness' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Heather  Courtois @ The Village At Inverness',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: tami schultz at The hof bar and grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The hof bar and grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'tami schultz', jsonb_build_array(jsonb_build_object('phone', '(231) 464-6123', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'The hof bar and grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'tami schultz @ The hof bar and grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Nick Ramsey at Turtle Creek Casino & Hotel
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Turtle Creek Casino & Hotel' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Nick Ramsey', jsonb_build_array(jsonb_build_object('phone', '(231) 534-8870', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Turtle Creek Casino & Hotel' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Nick Ramsey @ Turtle Creek Casino & Hotel',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Adam Volk at U OF I- HOUSING FOOD STORES
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'U OF I- HOUSING FOOD STORES' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Adam Volk', jsonb_build_array(jsonb_build_object('phone', '(217) 333-1412', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'U OF I- HOUSING FOOD STORES' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Adam Volk @ U OF I- HOUSING FOOD STORES',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Connie Steketee at Toast N Jams
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Toast N Jams' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Connie Steketee', jsonb_build_array(jsonb_build_object('phone', '(231) 737-5267', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Toast N Jams' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Connie Steketee @ Toast N Jams',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kevin Murray at VAL''S FAMOUS PIZZA & GRINDERS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VAL''S FAMOUS PIZZA & GRINDERS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kevin Murray', jsonb_build_array(jsonb_build_object('phone', '(219) 921-0056', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VAL''S FAMOUS PIZZA & GRINDERS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kevin Murray @ VAL''S FAMOUS PIZZA & GRINDERS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Amanda Joyner at Trilogy - Harbor Terrace Senior Liv
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Trilogy - Harbor Terrace Senior Liv' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Amanda Joyner', jsonb_build_array(jsonb_build_object('phone', '(231) 900-1713', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Trilogy - Harbor Terrace Senior Liv' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Amanda Joyner @ Trilogy - Harbor Terrace Senior Liv',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Natali Lorenzo at Tulip City Sports Bar & Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Tulip City Sports Bar & Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Natali Lorenzo', jsonb_build_array(jsonb_build_object('phone', '(616) 786-0223', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Tulip City Sports Bar & Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Natali Lorenzo @ Tulip City Sports Bar & Grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Hunter Williams at Vicinia Independent Living, LLC
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Vicinia Independent Living, LLC' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Hunter Williams', jsonb_build_array(jsonb_build_object('phone', '(810) 957-8458', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Vicinia Independent Living, LLC' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Hunter Williams @ Vicinia Independent Living, LLC',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kevin Murray at VAL''S FAMOUS PIZZA & GRINDERS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VAL''S FAMOUS PIZZA & GRINDERS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kevin Murray', jsonb_build_array(jsonb_build_object('phone', '(219) 921-0056', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VAL''S FAMOUS PIZZA & GRINDERS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kevin Murray @ VAL''S FAMOUS PIZZA & GRINDERS',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Joshua Petrick at VILLAGE INN PIZZA PARLOR
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VILLAGE INN PIZZA PARLOR' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Joshua Petrick', jsonb_build_array(jsonb_build_object('phone', '(616) 392-1818', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'VILLAGE INN PIZZA PARLOR' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Joshua Petrick @ VILLAGE INN PIZZA PARLOR',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: JENNIFER BOEHRI at Vickers Lakeside Tavern
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Vickers Lakeside Tavern' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'JENNIFER BOEHRI', jsonb_build_array(jsonb_build_object('phone', '(269) 475-5790', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Vickers Lakeside Tavern' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'JENNIFER BOEHRI @ Vickers Lakeside Tavern',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Vickers Lakeside Tavern' LIMIT 1
)
INSERT INTO activities (
  activity_type, type, subject, organization_id, created_by, created_at
)
SELECT 'engagement', 'note', 'Jennifer ordered ranch and garlic items', customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;

-- Contact: Alex Moravec at Villa Marine Bar and Grill
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Villa Marine Bar and Grill' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Alex Moravec', jsonb_build_array(jsonb_build_object('phone', '(231) 352-5450', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Villa Marine Bar and Grill' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Alex Moravec @ Villa Marine Bar and Grill',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Michael  Murray at WEST MICHIGAN PROVISIONS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST MICHIGAN PROVISIONS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Michael  Murray', jsonb_build_array(jsonb_build_object('phone', '(269) 668-4770', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST MICHIGAN PROVISIONS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Michael  Murray @ WEST MICHIGAN PROVISIONS',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Joe Frontier at Village Cafe And Pub
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Village Cafe And Pub' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Joe Frontier', jsonb_build_array(jsonb_build_object('phone', '(231) 869-4626', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Village Cafe And Pub' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Joe Frontier @ Village Cafe And Pub',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Michael  Murray at WEST MICHIGAN PROVISIONS
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST MICHIGAN PROVISIONS' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Michael  Murray', jsonb_build_array(jsonb_build_object('phone', '(269) 668-4770', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST MICHIGAN PROVISIONS' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Michael  Murray @ WEST MICHIGAN PROVISIONS',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Zac Roof at WEST ON WARREN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST ON WARREN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Zac Roof', jsonb_build_array(jsonb_build_object('phone', '(574) 358-0045', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST ON WARREN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Zac Roof @ WEST ON WARREN',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Matt Timon at WEST MICHIGAN WHITECAPS SUITES
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST MICHIGAN WHITECAPS SUITES' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Matt Timon', jsonb_build_array(jsonb_build_object('phone', '(616) 784-4131', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST MICHIGAN WHITECAPS SUITES' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Matt Timon @ WEST MICHIGAN WHITECAPS SUITES',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Sylvia Awald at WEST ON WARREN
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST ON WARREN' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Sylvia Awald', jsonb_build_array(jsonb_build_object('phone', '(574) 358-0045', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WEST ON WARREN' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Sylvia Awald @ WEST ON WARREN',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Mark Peets at WHITE LAKE EAGLES #3214
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WHITE LAKE EAGLES #3214' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Mark Peets', jsonb_build_array(jsonb_build_object('phone', '(231) 894-6263', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WHITE LAKE EAGLES #3214' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Mark Peets @ WHITE LAKE EAGLES #3214',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Andrew Francisco at WMU-Student Center
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WMU-Student Center' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Andrew Francisco', jsonb_build_array(jsonb_build_object('phone', '(269) 387-4860', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WMU-Student Center' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Andrew Francisco @ WMU-Student Center',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Peter Bishop at WOODSIDE BIBLE
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WOODSIDE BIBLE' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Peter Bishop', jsonb_build_array(jsonb_build_object('phone', '(248) 879-8533', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WOODSIDE BIBLE' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Peter Bishop @ WOODSIDE BIBLE',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Pam McEwen at Walts Meat Market
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Walts Meat Market' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Pam McEwen', jsonb_build_array(jsonb_build_object('phone', '(989) 738-7020', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Walts Meat Market' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Pam McEwen @ Walts Meat Market',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Cathy Howell at WICKED SISTER
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WICKED SISTER' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Cathy Howell', jsonb_build_array(jsonb_build_object('phone', '(906) 259-1086', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WICKED SISTER' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Cathy Howell @ WICKED SISTER',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Norman Gilliam at Whiskey Creek Campground
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Whiskey Creek Campground' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Norman Gilliam', jsonb_build_array(jsonb_build_object('phone', '(231) 898-2030', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Whiskey Creek Campground' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Norman Gilliam @ Whiskey Creek Campground',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Douglas Papinaw at WILLOW RIDGE GOLF CLUB
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WILLOW RIDGE GOLF CLUB' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Douglas Papinaw', jsonb_build_array(jsonb_build_object('phone', '(810) 982-7010', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'WILLOW RIDGE GOLF CLUB' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Douglas Papinaw @ WILLOW RIDGE GOLF CLUB',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Carey Vanderhoff at Wander In
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Wander In' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Carey Vanderhoff', jsonb_build_array(jsonb_build_object('phone', '(231) 299-1227', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Wander In' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Carey Vanderhoff @ Wander In',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Kristina Porritt at Yankee Bills
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yankee Bills' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Kristina Porritt', jsonb_build_array(jsonb_build_object('phone', '(269) 945-5499', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yankee Bills' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Kristina Porritt @ Yankee Bills',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Daniell Green at Yoders Country Market
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yoders Country Market' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Daniell Green', jsonb_build_array(jsonb_build_object('phone', '(540) 948-3000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yoders Country Market' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Daniell Green @ Yoders Country Market',
  (SELECT id FROM customer_org),
  1812,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Daniell Green at Yoders Country Market
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yoders Country Market' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Daniell Green', jsonb_build_array(jsonb_build_object('phone', '(540) 948-3000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yoders Country Market' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Daniell Green @ Yoders Country Market',
  (SELECT id FROM customer_org),
  1802,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);

-- Contact: Daniell Green at Yoders Country Market
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yoders Country Market' LIMIT 1
)
INSERT INTO contacts (name, phone, organization_id, created_by, created_at)
SELECT 'Daniell Green', jsonb_build_array(jsonb_build_object('phone', '(540) 948-3000', 'type', 'Work')), customer_org.id, NULL, CURRENT_TIMESTAMP
FROM customer_org;
WITH customer_org AS (
  SELECT id FROM organizations WHERE name = 'Yoders Country Market' LIMIT 1
)
INSERT INTO opportunities (
  name, customer_organization_id, principal_organization_id,
  stage, status, priority, estimated_close_date, campaign, created_by, created_at
) VALUES (
  'Daniell Green @ Yoders Country Market',
  (SELECT id FROM customer_org),
  1813,
  'initial_outreach', 'active', 'medium', '2025-12-11'::date, 'Grand Rapids Trade Show', NULL, CURRENT_TIMESTAMP
);


-- Reset sequences to prevent conflicts with seed.sql
SELECT setval('organizations_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM organizations), 10000));
SELECT setval('contacts_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM contacts), 10000));

COMMIT;

-- ✅ Import complete! Run validation queries to verify counts.
