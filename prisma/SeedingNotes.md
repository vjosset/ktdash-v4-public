```sql
INSERT INTO Faction (factionid, seq, factionname, description)
SELECT factionid, seq, factionname, description FROM killteam.Faction WHERE factionid NOT IN ('HBR', 'SPEC');

INSERT INTO Killteam (killteamid, factionid, seq, killteamname, description, composition, archetypes)
SELECT DISTINCT CONCAT(K.factionid, '-', REPLACE(K.killteamid, '24', '')), K.factionid, 0, K.killteamname, K.description, K.killteamcomp, GROUP_CONCAT(FT.archetype)
FROM killteam.Killteam K INNER JOIN killteam.Fireteam FT ON FT.factionid = K.factionid AND FT.killteamid = K.killteamid
WHERE K.factionid NOT IN ('HBR', 'SPEC') AND K.edition = 'kt24'
GROUP BY K.factionid, K.killteamid, K.killteamname, K.description, K.killteamcomp;

INSERT INTO OpType
SELECT CONCAT(factionid, '-', REPLACE(killteamid, '24', ''), '-', opid), CONCAT(factionid, '-', REPLACE(killteamid, '24', '')), opseq, opname, M, APL, SV, W, keywords, basesize
FROM killteam.Operative WHERE edition = 'kt24' AND factionid NOT IN ('HBR', 'SPEC') AND killteamid != 'INQ24';

/*Weapons + Profiles*/
INSERT INTO Weapon (wepid, opTypeid, seq, wepname, weptype, isdefault)
SELECT CONCAT(W.factionid, '-', REPLACE(W.killteamid, '24', ''), '-', W.opid, '-', W.wepid), CONCAT(W.factionid, '-', REPLACE(W.killteamid, '24', ''), '-', W.opid), wepseq, wepname, weptype, isdefault
FROM killteam.Operative O INNER JOIN killteam.Weapon W ON W.factionid = O.factionid AND W.killteamid = O.killteamid AND W.opid = O.opid
WHERE O.edition = 'kt24' AND O.factionid NOT IN ('HBR', 'SPEC') AND O.killteamid != 'INQ24';

INSERT INTO WeaponProfile (wepprofileid, wepid, seq, profilename, ATK, HIT, DMG, WR)
SELECT CONCAT(W.factionid, '-', REPLACE(W.killteamid, '24', ''), '-', W.opid, '-', W.wepid, '-', profileid), CONCAT(W.factionid, '-', REPLACE(W.killteamid, '24', ''), '-', W.opid, '-', W.wepid), profileid, name, A, BS, D, SR
FROM killteam.Operative O INNER JOIN killteam.WeaponProfile W ON W.factionid = O.factionid AND W.killteamid = O.killteamid AND W.opid = O.opid
WHERE O.edition = 'kt24' AND O.factionid NOT IN ('HBR', 'SPEC') AND O.killteamid != 'INQ24';

/*Abilities*/
INSERT INTO Ability (abilityId, opTypeId, abilityName, description)
SELECT CONCAT(A.factionid, '-', REPLACE(A.killteamid, '24', ''), '-', A.opid, '-A-', A.abilityid), CONCAT(A.factionid, '-', REPLACE(A.killteamid, '24', ''), '-', A.opid), A.title, A.description
FROM killteam.Operative O INNER JOIN killteam.Ability A ON A.factionid = O.factionid AND A.killteamid = O.killteamid AND A.opid = O.opid
WHERE O.edition = 'kt24' AND O.factionid NOT IN ('HBR', 'SPEC') AND O.killteamid != 'INQ24';

/*UniqueActions (-> Abilities)*/
INSERT INTO Ability (abilityId, opTypeId, AP, abilityName, description)
SELECT CONCAT(A.factionid, '-', REPLACE(A.killteamid, '24', ''), '-', A.opid, '-', A.uniqueactionid), CONCAT(A.factionid, '-', REPLACE(A.killteamid, '24', ''), '-', A.opid), A.AP, A.title, A.description
FROM killteam.Operative O INNER JOIN killteam.UniqueAction A ON A.factionid = O.factionid AND A.killteamid = O.killteamid AND A.opid = O.opid
WHERE O.edition = 'kt24' AND O.factionid NOT IN ('HBR', 'SPEC') AND O.killteamid != 'INQ24';

/*Ploys*/
INSERT INTO Ploy (ployId, killteamid, seq, ployType, ployName, description, effects)
SELECT CONCAT(P.factionid, '-', REPLACE(P.killteamid, '24', ''), '-', P.ployType, '-', P.ployid), CONCAT(P.factionid, '-', REPLACE(P.killteamid, '24', '')), 1, P.ployType, P.ployName, P.description, ''
FROM killteam.Ploy P INNER JOIN killteam.Killteam K ON K.edition = 'kt24' AND K.factionid NOT IN ('HBR', 'SPEC') AND K.killteamid != 'INQ24' AND K.factionid = P.factionid AND K.killteamid = P.killteamid;

/*Equipment*/
INSERT INTO Equipment (eqId, killteamid, seq, eqName, description, effects)
SELECT CONCAT(E.factionid, '-', REPLACE(E.killteamid, '24', ''), '-', E.eqid), CONCAT(E.factionid, '-', REPLACE(E.killteamid, '24', '')), E.eqseq, E.eqName, E.eqdescription, CONCAT(eqvar1, '|', eqvar2)
FROM killteam.Equipment E INNER JOIN killteam.Killteam K ON K.edition = 'kt24' AND K.factionid NOT IN ('HBR', 'SPEC') AND K.killteamid != 'INQ24' AND K.factionid = E.factionid AND K.killteamid = E.killteamid AND E.opid = '' AND E.eqcategory = 'Equipment';

/*Universal Equipment*/
INSERT INTO Equipment (eqId, killteamid, seq, eqName, description, effects)
SELECT CONCAT('UNIVERSAL-', E.eqid), null, E.eqseq, E.eqName, E.eqdescription, CONCAT(eqvar1, '|', eqvar2)
FROM killteam.Equipment E
WHERE E.eqcategory = 'Universal Equipment';

UPDATE Equipment SET effects = '' WHERE effects = '|';

/*Options*/
INSERT INTO `Option` (optionId, opTypeId, seq, optionName, description, effects)
SELECT CONCAT(E.factionid, '-', REPLACE(E.killteamid, '24', ''), '-', O.opid, '-', E.eqid), CONCAT(E.factionid, '-', REPLACE(E.killteamid, '24', ''), '-', O.opid), E.eqseq, eqName, eqdescription, CONCAT(eqvar1, '|', eqvar2)
FROM killteam.Equipment E
INNER JOIN killteam.Killteam KT ON  KT.factionid = E.factionid AND KT.killteamid = E.killteamid AND KT.edition = 'kt24'
INNER JOIN killteam.Operative O ON O.factionid = E.factionid AND O.killteamid = E.killteamid AND E.fireteamid IN ('', O.fireteamid) AND E.opid IN ('', O.opid)
WHERE E.eqcategory NOT IN ('Rare Equipment', 'Equipment', 'Battle Scar', 'Battle Honour', 'Universal Equipment');

/*Cleanup*/
UPDATE Equipment SET effects = '' WHERE effects = '|';
UPDATE `Option` SET effects = '' WHERE effects = '|';

/*Convert HTML to Markdown*/

/*Abilities*/
UPDATE Ability SET description = REPLACE(REPLACE(description, '<em>', '*'), '</em>', '*');
UPDATE Ability SET description = REPLACE(REPLACE(description, '<strong>', '**'), '</strong>', '**');
UPDATE Ability SET description = REPLACE(REPLACE(description, '<h5>', '##### '), '</h5>', '');
UPDATE Ability SET description = REPLACE(description, '<br/>', '  
');
UPDATE Ability SET description = REPLACE(REPLACE(description, '<li>', '- '), '</li>', '');
UPDATE Ability SET description = REPLACE(REPLACE(description, '<ul>', ''), '</ul>', '');
UPDATE Ability SET description = REPLACE(description, '\t- ', '- ');

/*UniqueActions*/
UPDATE UniqueAction SET description = REPLACE(REPLACE(description, '<em>', '*'), '</em>', '*');
UPDATE UniqueAction SET description = REPLACE(REPLACE(description, '<strong>', '**'), '</strong>', '**');
UPDATE UniqueAction SET description = REPLACE(REPLACE(description, '<h5>', '##### '), '</h5>', '');
UPDATE UniqueAction SET description = REPLACE(description, '<br/>', '  
');
UPDATE UniqueAction SET description = REPLACE(REPLACE(description, '<li>', '- '), '</li>', '');
UPDATE UniqueAction SET description = REPLACE(REPLACE(description, '<ul>', ''), '</ul>', '');
UPDATE UniqueAction SET description = REPLACE(description, '\t- ', '- ');

/*Options*/
UPDATE `Option` SET description = REPLACE(REPLACE(description, '<em>', '*'), '</em>', '*');
UPDATE `Option` SET description = REPLACE(REPLACE(description, '<strong>', '**'), '</strong>', '**');
UPDATE `Option` SET description = REPLACE(REPLACE(description, '<h5>', '##### '), '</h5>', '');
UPDATE `Option` SET description = REPLACE(description, '<br/>', '  
');
UPDATE `Option` SET description = REPLACE(REPLACE(description, '<li>', '- '), '</li>', '');
UPDATE `Option` SET description = REPLACE(REPLACE(description, '<ul>', ''), '</ul>', '');
UPDATE `Option` SET description = REPLACE(description, '\t- ', '- ');

/*Ploys*/
UPDATE Ploy SET description = REPLACE(REPLACE(description, '<em>', '*'), '</em>', '*');
UPDATE Ploy SET description = REPLACE(REPLACE(description, '<strong>', '**'), '</strong>', '**');
UPDATE Ploy SET description = REPLACE(REPLACE(description, '<h5>', '##### '), '</h5>', '');
UPDATE Ploy SET description = REPLACE(description, '<br/>', '  
');
UPDATE Ploy SET description = REPLACE(REPLACE(description, '<li>', '- '), '</li>', '');
UPDATE Ploy SET description = REPLACE(REPLACE(description, '<ul>', ''), '</ul>', '');
UPDATE Ploy SET description = REPLACE(description, '\t- ', '- ');

/*Equipments*/
UPDATE Equipment SET description = REPLACE(REPLACE(description, '<em>', '*'), '</em>', '*');
UPDATE Equipment SET description = REPLACE(REPLACE(description, '<strong>', '**'), '</strong>', '**');
UPDATE Equipment SET description = REPLACE(REPLACE(description, '<h5>', '##### '), '</h5>', '');
UPDATE Equipment SET description = REPLACE(description, '<br/>', '  
');
UPDATE Equipment SET description = REPLACE(REPLACE(description, '<li>', '- '), '</li>', '');
UPDATE Equipment SET description = REPLACE(REPLACE(description, '<ul>', ''), '</ul>', '');
UPDATE Equipment SET description = REPLACE(description, '\t- ', '- ');

/*Factions*/
UPDATE Faction SET description = REPLACE(REPLACE(description, '<em>', '*'), '</em>', '*');
UPDATE Faction SET description = REPLACE(REPLACE(description, '<strong>', '**'), '</strong>', '**');
UPDATE Faction SET description = REPLACE(description, '<br/>', '  
');
UPDATE Faction SET description = REPLACE(description, '</br>', '  
');
UPDATE Faction SET description = REPLACE(REPLACE(description, '<li>', '- '), '</li>', '');
UPDATE Faction SET description = REPLACE(REPLACE(description, '<ul>', ''), '</ul>', '');

/*KillTeams*/
UPDATE Killteam SET description = REPLACE(REPLACE(description, '<em>', '*'), '</em>', '*');
UPDATE Killteam SET description = REPLACE(REPLACE(description, '<strong>', '**'), '</strong>', '**');
UPDATE Killteam SET description = REPLACE(description, '<br/>', '  
');
UPDATE Killteam SET description = REPLACE(description, '</br>', '  
');
UPDATE Killteam SET description = REPLACE(REPLACE(description, '<li>', '- '), '</li>', '');
UPDATE Killteam SET description = REPLACE(REPLACE(description, '<ul>', ''), '</ul>', '');
UPDATE Killteam SET composition = REPLACE(REPLACE(composition, '<em>', '*'), '</em>', '*');
UPDATE Killteam SET composition = REPLACE(REPLACE(composition, '<strong>', '**'), '</strong>', '**');
UPDATE Killteam SET composition = REPLACE(composition, '<br/>', '  
');
UPDATE Killteam SET composition = REPLACE(REPLACE(composition, '<li>', '- '), '</li>', '');
UPDATE Killteam SET composition = REPLACE(REPLACE(composition, '<ul>', ''), '</ul>', '');

/*Formatting Eq Tables*/
UPDATE Equipment SET description = REPLACE(description,
'<table class="eqtable">
<tr>
<th>Name</th><th>ATK</th><th>HIT</th><th>DMG</th><th>
</tr>
<tr>',
'|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|');
UPDATE Equipment SET description = REPLACE(description, '<th colspan="4">Weapon Rules</th>', '|**Weapon Rules**|');
UPDATE Equipment SET description = REPLACE(description, '<table class="eqtable">', '');
UPDATE Equipment SET description = REPLACE(description, '</table>', '');
UPDATE Equipment SET description = REPLACE(description, '<tr>
', '');
UPDATE Equipment SET description = REPLACE(description, '</tr>
', '');
UPDATE Equipment SET description = REPLACE(description, '<tr>', '');
UPDATE Equipment SET description = REPLACE(description, '</tr>', '');
UPDATE Equipment SET description = REPLACE(description, '</th><th>', '**|**');
UPDATE Equipment SET description = REPLACE(description, '<th>', '|**');
UPDATE Equipment SET description = REPLACE(description, '</th>', '**|');
UPDATE Equipment SET description = REPLACE(description, '</td><td>', '|');
UPDATE Equipment SET description = REPLACE(description, '<td>', '|');
UPDATE Equipment SET description = REPLACE(description, '</td>', '|');
UPDATE Equipment SET description = REPLACE(description, '|**
', '|');
UPDATE Equipment SET description = REPLACE(description, 'weapon:
|', 'weapon:

|')

/*Formatting Option Tables*/
UPDATE `Option` SET description = REPLACE(description,
'<table class="eqtable">
<tr>
<th>Name</th><th>ATK</th><th>HIT</th><th>DMG</th><th>
</tr>
<tr>',
'|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|');
UPDATE `Option` SET description = REPLACE(description, '<th colspan="4">Weapon Rules</th>', '|**Weapon Rules**|');
UPDATE `Option` SET description = REPLACE(description, '<table class="eqtable">', '');
UPDATE `Option` SET description = REPLACE(description, '</table>', '');
UPDATE `Option` SET description = REPLACE(description, '<tr>
', '');
UPDATE `Option` SET description = REPLACE(description, '</tr>
', '');
UPDATE `Option` SET description = REPLACE(description, '<tr>', '');
UPDATE `Option` SET description = REPLACE(description, '</tr>', '');
UPDATE `Option` SET description = REPLACE(description, '</th><th>', '**|**');
UPDATE `Option` SET description = REPLACE(description, '<th>', '|**');
UPDATE `Option` SET description = REPLACE(description, '</th>', '**|');
UPDATE `Option` SET description = REPLACE(description, '</td><td>', '|');
UPDATE `Option` SET description = REPLACE(description, '<td>', '|');
UPDATE `Option` SET description = REPLACE(description, '</td>', '|');
UPDATE `Option` SET description = REPLACE(description, '|**
', '|');
UPDATE `Option` SET description = REPLACE(description, 'weapon:
|', 'weapon:

|')

/*Equipment Cleanup (tables)*/
UPDATE Equipment SET description = 'Once per turning point, a friendly KOMMANDO operative (excluding BOMB SQUIG and GROT) can use the following Ranged Weapon:

|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|
|Harpoon|4|4+|4/5|
|**Weapon Rules**|
|Rng 8", Lethal 5+, Stun|'
WHERE killteamid = 'ORK-KOM' AND eqid = 'ORK-KOM-HRP';

UPDATE Equipment SET description = 'Friendly KOMMANDO operatives (excluding BOMB SQUIG and GROT) have the following melee weapon. Note that some operatives already have this weapon but with better stats, in that instance, use the better version.
 
|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|
|Choppa|3|3+|4/5|'
WHERE killteamid = 'ORK-KOM' AND eqid = 'ORK-KOM-CHP';

UPDATE Equipment SET description = 
'Friendly PLAGUE MARINE operatives have the following ranged weapon (you cannot select it for use more than twice during the battle):
 
|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|
|Blight Grenade|4|4+|2/4|
|**Weapon Rules**|
|Range 6", Blast 2", Saturate, Severe, *Poison|'
WHERE killteamid = 'CHAOS-PM' AND eqid = 'CHAOS-PM-BG';

UPDATE Equipment SET description = 
'Friendly HEARTHKYN SALVAGER operatives have the following melee weapon. Note that the FIELD MEDIC operative already has this weapon but with better stats; in that instance, use the better version.

|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|
|Plasma Knife|3|4+|3/5|
|**Weapon Rules**|
|Lethal 5+|'
WHERE killteamid = 'VOT-HKS' AND eqid = 'VOT-HKS-PK';

UPDATE Equipment SET description = 
'When you select this equipment, select two explosive grenades (2 frag, 2 krak, or 1 frag and 1 krak).

|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|
|Frag Grenade|4|4+|2/4|
|**Weapon Rules**|
|Rng 6", Blast 2", Saturate|'
WHERE killteamid IS NULL AND eqid = 'UNIVERSAL-UE-XG-FRAG';

UPDATE Equipment SET description = 
'When you select this equipment, select two explosive grenades (2 frag, 2 krak, or 1 frag and 1 krak).

|**Name**|**ATK**|**HIT**|**DMG**|
|-----|:-----:|:-----:|:-----:|
|Frag Grenade|4|4+|4/5|
|**Weapon Rules**|
|Rng 6", Piercing 1, Saturate|'
WHERE killteamid IS NULL AND eqid = 'UNIVERSAL-UE-XG-KRAK';

/*Users*/
INSERT INTO User (userId, email, userName, password)
SELECT userId, '', userName, passhash FROM killteam.User WHERE userid IN ('vince', 'prebuilt', 'ZiSLC', 'g0o0g', 'cWwiz', 'yjYl7');

/*Rosters*/
INSERT INTO ktdashv4.Roster (rosterid, userid, killteamId, rosterName, seq, hasCustomPortrait, updatedAt)
SELECT R.rosterId, R.userid, CONCAT(R.factionid, '-', REPLACE(R.killteamid, '24', '')), R.rostername, R.seq, false, NOW()
FROM killteam.Roster R INNER JOIN killteam.Killteam K ON K.killteamid = R.killteamId AND K.factionid = R.factionId
WHERE K.factionid NOT IN ('HBR', 'SPEC') AND K.edition = 'kt24'
AND R.userid IN ('vince', 'prebuilt', 'ZiSLC', 'g0o0g', 'cWwiz', 'yjYl7');

/*Ops*/
INSERT INTO ktdashv4.Op (opId, rosterId, opTypeId, seq, opName, isActivated, currWOUNDS, wepIds, optionIds, hasCustomPortrait, updatedAt)
SELECT RO.rosteropid, RO.rosterid, CONCAT(RO.factionid, '-', REPLACE(RO.killteamid, '24', ''), '-', RO.opid), RO.seq, RO.opname, RO.activated, O.W,
CONCAT(RO.factionid, '-', REPLACE(RO.killteamid, '24', ''), '-', RO.opid, '-', REPLACE(RO.wepIds, ',', CONCAT(',', RO.factionid, '-', REPLACE(RO.killteamid, '24', ''), '-', RO.opid, '-'))),
'', false, NOW()
FROM killteam.Roster R INNER JOIN killteam.Killteam K ON K.killteamid = R.killteamId AND K.factionid = R.factionId INNER JOIN killteam.RosterOperative RO ON RO.rosterid = R.rosterID INNER JOIN killteam.Operative O ON O.factionid = RO.factionid AND O.killteamid = RO.killteamid AND O.fireteamid = RO.fireteamid AND O.opid = RO.opid
WHERE K.factionid NOT IN ('HBR', 'SPEC') AND K.edition = 'kt24'
AND R.userid IN ('vince', 'prebuilt', 'ZiSLC', 'g0o0g', 'cWwiz', 'yjYl7');

/* FOR GO-LIVE - SELECT A CUTOFF DATE (2025-01-01 in the example below)
SELECT U.userId, '', U.userName, U.passhash FROM killteam.User U WHERE userid IN ('vince', 'prebuilt', 'ZiSLC', 'g0o0g', 'yjYl7') OR userid IN (SELECT DISTINCT UserID FROM killteam.Event WHERE datestamp > '2025-01-01' AND userid != '[anon]');

SELECT R.rosterId, R.userid, CONCAT(R.factionid, '-', REPLACE(R.killteamid, '24', '')), R.rostername, R.seq, false, NOW()
FROM killteam.Roster R INNER JOIN killteam.Killteam K ON K.killteamid = R.killteamId AND K.factionid = R.factionId
WHERE K.factionid NOT IN ('HBR', 'SPEC') AND K.edition = 'kt24'
AND R.userid IN ('vince', 'prebuilt', 'ZiSLC', 'g0o0g', 'yjYl7') OR userid IN (SELECT DISTINCT UserID FROM killteam.Event WHERE datestamp > '2025-01-01' AND userid != '[anon]');

SELECT RO.rosteropid, RO.rosterid, CONCAT(RO.factionid, '-', REPLACE(RO.killteamid, '24', ''), '-', RO.opid), RO.seq, RO.opname, RO.activated, O.W,
CONCAT(RO.factionid, '-', REPLACE(RO.killteamid, '24', ''), '-', RO.opid, '-', REPLACE(RO.wepIds, ',', CONCAT(',', RO.factionid, '-', REPLACE(RO.killteamid, '24', ''), '-', RO.opid, '-'))),
'', false, NOW()
FROM killteam.Roster R INNER JOIN killteam.Killteam K ON K.killteamid = R.killteamId AND K.factionid = R.factionId INNER JOIN killteam.RosterOperative RO ON RO.rosterid = R.rosterID INNER JOIN killteam.Operative O ON O.factionid = RO.factionid AND O.killteamid = RO.killteamid AND O.fireteamid = RO.fireteamid AND O.opid = RO.opid
WHERE K.factionid NOT IN ('HBR', 'SPEC') AND K.edition = 'kt24'
AND R.userid IN ('vince', 'prebuilt', 'ZiSLC', 'g0o0g', 'yjYl7') OR R.userid IN (SELECT DISTINCT UserID FROM killteam.Event WHERE datestamp > '2025-01-01' AND userid != '[anon]');
*/

/*WeaponRules*/
INSERT INTO WeaponRule (code, rulename, description) VALUES ('ACC_', 'Accurate _', 'You can retain up to _ Attack Dice as normal successes without rolling them.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('AP_', 'Armor Piercing _', 'Remove _ Defence dice from target before roll. Multiple APs do not stack.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('BAL', 'Balanced', 'Can re-roll one Attack die.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('BARRAGE', 'Barrage', 'Cover is measured from above.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('BLAST_', 'Blast _', 'The target you select is the primary target. After shooting the primary target, shoot with this weapon against each secondary target in an order of your choice (roll each sequence separately). Secondary targets are other ops visible to and within _ of the primary target (they are all valid targets, regardless of a Conceal order). Secondary targets are in cover and obscured if the primary target was.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('BRUTAL', 'Brutal', 'Opponent can only parry with critical hits.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('CEASELESS', 'Ceaseless', 'Can re-roll any or all results of one value (e.g. all results of 2).');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('HOT', 'Hot', 'After using this weapon, roll 1D6. If the result is less than the weapon''s HIT stat, inflict Damage on that op equal to the result multiplied by 2. If it is used multiple times in one action (e.g. Blast), roll only 1D6.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('HVY', 'Heavy', 'An op cannot use this weapon in an activation or counteraction in which it moved, and it cannot move in an activation or counteraction in which it used this weapon.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('HVY_', 'Heavy _', 'An op cannot use this weapon in an activation in which it moved, and it cannot move in an activation in which it used this weapon. This rule has no effect on preventing the Guard action.  Only the _ action is allowed.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('LETHAL_', 'Lethal _', 'Inflict critical hits on _ instead of 6+.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('LIM', 'Limited', 'After an op uses this weapon _ times, they no longer have it. If it is used multiple times in one action (e.g. Blast) treat this as one use.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('LIM_', 'Limited _', 'The defender collects _ less Defence dice.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('MW_', 'Mortal Wounds _', 'For each critical hit retained, inflict _ Mortal Wounds to target.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('PRC_', 'Piercing _', 'The defender collects _ less Defence dice.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('PRCCRIT_', 'Piercing Crits _', 'If you retain any critical successes, the defender collects _ less Defence dice.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('RELENTLESS', 'Relentless', 'Can re-roll any or all Attack dice.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('REND', 'Rending', 'If you retain any critical hits, retain 1 normal hit as a critical hit instead.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('RENDING', 'Rending', 'If you retain any critical hits, retain 1 normal hit as a critical hit instead.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('RNG_', 'Range _', 'Range limit of the weapon.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SAT', 'Saturate', 'The defender cannot retain Cover saves.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SATURATE', 'Saturate', 'The defender cannot retain Cover saves.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SEV', 'Severe', 'If you do not retain any critical successes, you can change one of your normal successes to a critical success. The Devastating and Piercing Crits weapon rules still take effect, but Punishing and Rending don’t.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SHOCK', 'Shock', 'The first time you strike with a critical success in each sequence, also discard one of your opponent''s unresolved normal successes (or a critical success if there are none).');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SIL', 'Silent', 'Can Shoot this weapon while on a Conceal order.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SILENT', 'Silent', 'Can Shoot this weapon while on a Conceal order.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('STUN', 'Stun', 'If you retain any critical hits, subtract 1 from APL of target until the end of its next activation.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('TOR_', 'Torrent _', 'Each time a friendly op performs a Shoot action or Overwatch action and selects this weapon, after making the shooting attack against the target, it can make a shooting attack with this weapon against each other valid target within _ of the original target.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SATURATE', 'Saturate', 'The defender cannot retain Cover saves.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('BALANCED', 'Balanced', 'Can re-roll one Attack die.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('RLT', 'Relentless', 'Can re-roll any or all Attack dice.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SEVERE', 'Severe', 'If you do not retain any critical successes, you can change one of your normal successes to a critical success. Any rules that take effect as a result of retaining a critical success (e.g. Devastating, Piercing Crits, etc.) still do.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('SILENT', 'Silent', 'Can Shoot this weapon while on a Conceal order.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('TORRENT_', 'Torrent _', 'Each time a friendly op performs a Shoot action or Overwatch action and selects this weapon, after making the shooting attack against the target, it can make a shooting attack with this weapon against each other valid target within _ of the original target.');
INSERT INTO WeaponRule (code, rulename, description) VALUES ('RND', 'Rending', 'If you retain any critical hits, retain 1 normal hit as a critical hit instead.');

/*NameTypes*/
UPDATE OpType SET nameType = 'CORVIUS' WHERE killteamid IN ('IMP-AOD', 'IMP-PHO', 'IMP-SCT');
UPDATE OpType SET nameType = 'DECAETA' WHERE killteamid IN ('IMP-NOV');
UPDATE OpType SET nameType = 'BEARAXE' WHERE killteamid IN ('VOT-HKS', 'VOT-HKY');
UPDATE OpType SET nameType = 'AESBAER' WHERE killteamid LIKE ('AEL-%') OR killteamid IN ('CHAOS-GORE', 'CHAOS-GPI');
UPDATE OpType SET nameType = 'STACEY,GEORGE' WHERE killteamid IN ('IMP-AES', 'IMP-DKK', 'IMP-INB', 'IMP-KAS', 'IMP-RAT', 'IMP-TEMPAQ');
UPDATE OpType SET nameType = 'TYRANID' WHERE killteamid LIKE ('TYR-RAV');
UPDATE OpType SET nameType = 'ADMECH' WHERE killteamid IN ('IMP-BC', 'IMP-HC');
UPDATE OpType SET nameType = 'KASSOTHOR' WHERE killteamid IN ('CHAOS-PM', 'CHAOS-WC', 'CHAOS-NC', 'CHAOS-LEG');
UPDATE OpType SET nameType = 'ORK' WHERE killteamid LIKE 'ORK-%';
UPDATE OpType SET nameType = 'NECRON,HIEROTEK' WHERE killteamid LIKE 'NEC%';
UPDATE OpType SET nameType = 'BEASTMAN' WHERE killteamid = 'CHAOS-FELL';
UPDATE OpType SET nameType = 'CULTIST' WHERE killteamid = 'CHAOS-CULT';
UPDATE OpType SET nameType = 'KROOT' WHERE killteamid = 'TAU-FSKB';
UPDATE OpType SET nameType = 'TAU' WHERE killteamid IN ('TAU-PF', 'TAU-VESP');
/*Starstriders*/
UPDATE OpType SET nameType = 'Elucia Vhane' WHERE (opTypeId = 'IMP-ESS-EV');
UPDATE OpType SET nameType = 'Aximillion' WHERE (opTypeId = 'IMP-ESS-CAN');
UPDATE OpType SET nameType = 'Knosso Prond' WHERE (opTypeId = 'IMP-ESS-DCE');
UPDATE OpType SET nameType = 'Larsen van der Gauss' WHERE (opTypeId = 'IMP-ESS-LM');
UPDATE OpType SET nameType = 'Sanistasia Minst' WHERE (opTypeId = 'IMP-ESS-REJAD');
UPDATE OpType SET nameType = 'Stromian Grell' WHERE (opTypeId = 'IMP-ESS-VM');
/*Pathfinder Drones*/
UPDATE OpType SET nameType = 'MB3' WHERE (opTypeId = 'TAU-PF-MB3');
UPDATE OpType SET nameType = 'MV1' WHERE (opTypeId = 'TAU-PF-MV1');
UPDATE OpType SET nameType = 'MV31' WHERE (opTypeId = 'TAU-PF-MV31');
UPDATE OpType SET nameType = 'MV33' WHERE (opTypeId = 'TAU-PF-MV33');
UPDATE OpType SET nameType = 'MV4' WHERE (opTypeId = 'TAU-PF-MV4');
UPDATE OpType SET nameType = 'MV7' WHERE (opTypeId = 'TAU-PF-MV7');
/*Necron Accelerator/Reanimator*/
UPDATE OpType SET nameType = 'Accelerator' WHERE (opTypeId = 'NEC-HIER-PA');
UPDATE OpType SET nameType = 'Reanimator' WHERE (opTypeId = 'NEC-HIER-PR');
/*Skwiglz*/
UPDATE OpType SET nameType = 'Skwiglz' WHERE (opTypeId = 'ORK-KOM-SQUIG');
/*Brood Special*/
UPDATE OpType SET nameType = 'TYRANID' WHERE opTypeID IN ('TYR-BBRO-FAM', 'TYR-BBRO-MAG', 'TYR-BBRO-PAT', 'TYR-BBRO-PRIM');

/* Killteam Composition Reformatting */

/***********************************/
/*  Blades Of Khaine  */
/***********************************/
UPDATE Killteam SET composition =
'A BLADES OF KHAINE KillTeam is composed of:

- 1 BLADES OF KHAINE operative selected from the following list:
  - DIRE AVENGER EXARCH with one of the following options:
    - Shuriken catapult; fists
      - Twin shuriken catapult; gun butts  
    Or one option from each of the following:
    - Diresword or power weapon
      - Shuriken pistol or shimmershield
  - HOWLING BANSHEE EXARCH with one of the following options:
    - Mirrorswords
      - Shuriken pistol; executioner
      - Shuriken pistol; power weapon
      - Shuriken pistol; triskele
      - Triskele; power weapon
  - STRIKING SCORPION EXARCH with one of the following options:
    - Shuriken pistol; biting blade
      - Shuriken pistol; scorpion’s claw & chainsword
      - Twin shuriken pistols; twin chainswords  
- 7 BLADES OF KHAINE operatives selected from the following list:
  - DIRE AVENGER WARRIOR
  - HOWLING BANSHEE WARRIOR
  - STRIKING SCORPION WARRIOR'
  WHERE killteamid = 'AEL-BOK';

/***********************************/
/*  Corsair Voidscarred  */
/***********************************/
UPDATE Killteam SET composition =
'A CORSAIR VOIDSCARRED killteam is composed of:
- 1 CORSAIR VOIDSCARRED Felarch operative with one of the following options:
  - Shuriken rifle, shuriken pistol, power weapon
  - Neuro Disruptor, Power weapon
- 8 CORSAIR VOIDSCARRED operatives selected from the following list:
  - Fate Dealer
  - Gunner with one of the following options:
  - Blaster (X), Shuriken pistol, fists
    - Shredder, Shuriken pistol, fists
  - Heavy Gunner with one of the following options:
    - Shuriken Cannon, Shuriken pistol, fists
    - Wraithcannon (X), Shuriken pistol, fists  
  - Kurnathi
  - Kurnite Hunter
  - Shade Runner
  - Soul Weaver
  - Starstorm Duelist
  - Warrior with one of the following options:
    - Shuriken pistol, power weapon
  - Shuriken rifle, fists  
  - Way Seeker

Other than Warrior operatives your kill team can only include each operative on this lists once.  

(X) Your kill team cannot include both a blaster and a wraithcannon.' WHERE killteamid = 'AEL-COR';

/***********************************/
/*  Hand Of The Archon  */
/***********************************/
UPDATE Killteam SET composition =
'A HAND OF THE ARCHON KillTeam is composed of:

- 1 HAND OF THE ARCHON ARCHSYBARITE operative with one of the following options:
  - Blast pistol; venom blade
  - Splinter pistol; venom blade
  - Splinter pistol; agoniser
  - Splinter pistol; power weapon
  - Splinter rifle; array of blades
- 8 HAND OF THE ARCHON operatives selected from the following list:
  - AGENT
  - CRIMSON DUELLIST
  - DISCIPLE OF YAELINDRA
  - ELIXICANT
  - FLAYER
  - GUNNER with one of the following options:
    - Blaster; array of blades
    - Shredder; array of blades
  - HEAVY GUNNER with one of the following options:
    - Dark lance; array of blades
    - Splinter cannon; array of blades
  - SKYSPLINTER ASSASSIN

Other than AGENT operatives, your kill team can only include each operative on this list once.  

Your kill team can only include up to two darklight weapons (blast pistol, blaster and dark lance are darklight weapons).' WHERE killteamid = 'AEL-HOTA';

/***********************************/
/*  Mandrakes  */
/***********************************/
UPDATE Killteam SET composition =
'A MANDRAKE killteam is composed of:

- 1 MANDRAKE Nightfiend
- 8 MANDRAKE operatives selected from the following list:  
  - Abyssal
  - Chooser of the Flesh
  - Dirgemaw
  - Shadeweaver
  - Warrior

Other than Warrior operatives, your Killteam can only include each operative once.' WHERE killteamid = 'AEL-MND';

/***********************************/
/*  Void-Dancer Troupe  */
/***********************************/
UPDATE Killteam SET composition =
'A VOID-DANCER TROUPE killteam is composed of:

- 1 VOID-DANCER TROUPE LEAD PLAYER operative with one option from each of the following:
  - Fusion pistol, neuro disruptor or shuriken pistol
  - Blade, caress, embrace, kiss or power weapon
- 7 VOID-DANCER TROUPE operatives selected from the following list:
  - DEATH JESTER
  - PLAYER with one option from each of the following:
    - Fusion pistol, neuro disruptor or shuriken pistol
    - Blade, caress, embrace or kiss    
  - SHADOWSEER with hallucinogen grenade and one of the following options:
    - Neuro disruptor; miststave
    - Shuriken pistol; miststave

Other than PLAYER operatives, your kill team can only include each operative on this list once. Your kill team can only include up to one fusion pistol and up to one neuro disruptor.
' WHERE killteamid = 'AEL-VDT';

/***********************************/
/*  Blooded  */
/***********************************/
UPDATE Killteam SET composition =
'A BLOODED killteam is composed of:
- 1 Blooded Chieftan operative with one of the following options:
  - Autopistol or laspistol, chainsword or power weapon
  - Bolt Pistol, chainsword
  - Boltgun, bayonet
  - Plasma pistol, improvised Blade *(2)*
- 9 Blooded operatives selected from the following list:
  - Brimstone Grenadier
  - Butcher
  - Commsman
  - Corpseman  - Flenser
  - Gunner with bayonet and Flamer *(1)*
  - Gunner with bayonet and Grenade Launcher *(1)*
  - Gunner with bayonet and Meltagun *(1)*
  - Gunner with bayonet and plasma gun *(1,2)*
  - Sharpshooter *(1)*
  - Thug
  - Trench Sweeper
  - Trooper
- 4 Blooded operatives selected from the following list:
 - Enforcer (counts as two selections)
 - Ogryn (counts as two selections)
 - Trooper

Other than Trooper operatives your Kill Team can only include each operative on this list once.  

**(1):** You cannot select more than three of these operatives combined  

**(2):** You cannot select this option and this operative. In other words you can only have one operative with a plasma weapon.' WHERE killteamid = 'CHAOS-BLD';

/***********************************/
/*  Chaos Cult  */
/***********************************/
UPDATE Killteam SET composition =
'A CHAOS CULT killteam is composed of:
 
- 1 CULT DEMAGOGUE operative
- 2 BLESSED BLADE operatives
- 9 CHAOS DEVOTEE operatives
- 1 ICONARCH operative
- 1 MINDWITCH operative
' WHERE killteamid = 'CHAOS-CULT';

/***********************************/
/*  Fellgor Ravagers  */
/***********************************/
UPDATE Killteam SET composition =
'A FELLGOR RAVAGERS KillTeam is composed of:

- 1 FELLGOR RAVAGER IRONHORN operative with one of the following options:
  - Corrupted pistol; corrupted chainsword
  - Plasma pistol; bludgeon
- 9 FELLGOR RAVAGER operatives selected from the following list:
  - DEATHKNELL
  - FLUXBRAY
  - GNARLSCAR
  - GOREHORN
  - HERD-GOAD
  - MANGLER
  - SHAMAN
  - TOXHORN
  - VANDAL
  - WARRIOR with one of the following options:
    - Autopistol; bludgeon
    - Autopistol; cleaver

Other than WARRIOR operatives, your kill team can only include each operative on this list once.' WHERE killteamid = 'CHAOS-FELL';

/***********************************/
/*  Goremongers  */
/***********************************/
UPDATE Killteam SET composition =
'A GOREMONGER kill team is composed of:

- 1 GOREMONGER BLOOD HERALD
- 7 GOREMONGER operatives selected from the following list:
  - ASPIRANT
  - BLOODTAKER
  - IMPALER
  - INCITER
  - SKULLCLAIMER
  - STALKER

Other than ASPIRANT operatives, your kill team can only include each operative on this list once.' WHERE killteamid = 'CHAOS-GORE';

/***********************************/
/*  Gellerpox Infected  */
/***********************************/
UPDATE Killteam SET composition =
'Note that other than MUTOID VERMIN, you do not select your operatives from a list.  

This kill team’s operatives are specified.  

A GELLERPOX INFECTED killteam is composed of every GELLERPOX INFECTED operative in the following list:

- 1 GELLERPOX INFECTED VULGRAR THRICE-CURSED
- 1 GELLERPOX INFECTED BLOATSPAWN
- 1 GELLERPOX INFECTED FLESHSCREAMER
- 1 GELLERPOX INFECTED LUMBERGHAST
- 4 GELLERPOX INFECTED GLITCHLING
- 1 GELLERPOX INFECTED MUTANT with frag grenade and heavy axe
- 2 GELLERPOX INFECTED MUTANT with frag grenade and improvised weapon

If you selected the Mutoid Vermin faction equipment:  

Specified number of GELLERPOX INFECTED operatives selected from the following list:

- CURSEMITE
- EYESTINGER SWARM
- SLUDGE-GRUB
' WHERE killteamid = 'CHAOS-GPI';

/***********************************/
/*  Legionaries  */
/***********************************/
UPDATE Killteam SET composition =
'A LEGIONARIES KillTeam is composed of:

- 1 LEGIONARY operative selected from the following list:
  - ASPIRING CHAMPION with one option from each of the following:
    - Plasma pistol or tainted bolt pistol
    - Power fist, power maul, power weapon or tainted chainsword  
  - CHOSEN with one of the following options:
    - Plasma pistol; daemon blade
    - Tainted bolt pistol; daemon blade
- 5 LEGIONARY operatives selected from the following list:
  - ANOINTED
  - BALEFIRE ACOLYTE
  - BUTCHER
  - ICON BEARER with one of the following options:
    - Boltgun; fists
    - Bolt pistol; chainsword  
  - SHRIVETALON
    - WARRIOR with one of the following options:
    - Boltgun; fists
    - Bolt pistol; chainsword    
  - GUNNER with one of the following options:
    - Bolt pistol; flamer; fists
      - Bolt pistol; meltagun; fists
      - Bolt pistol; plasma gun; fists   
  - HEAVY GUNNER with one of the following options:
    - Bolt pistol; heavy bolter; fists
    - Bolt pistol; missile launcher; fists
    - Bolt pistol; reaper chaincannon; fists

Other than WARRIOR operatives, your kill team can only include each operative on this list once.' WHERE killteamid = 'CHAOS-LEG';

/***********************************/
/*  Nemesis Claw  */
/***********************************/
UPDATE Killteam SET composition =
'A NEMESIS CLAW KillTeam is composed of:

- 1 NEMESIS CLAW Visionary with one of the following options:
  - Bolt pistol, power fist
  - Bolt pistol, power maul
  - Bolt pistol, power weapon
  - Plasma Pistol, Nostraman Chainblade
- 5 Nemesis Claw operatives selected from the following list:
  - Fearmonger
  - Gunner with one of the following options:
    - Bolt Pistol, Flamer, Fists
      - Bolt Pistol, Meltagun, Fists
      - Bolt Pistol, Plasma Gun, Fists   
  - Heavy Gunner with one of the following options:
    - Bolt Pistol, Heavy Bolter, Fists
    - Bolt Pistol, Missile Launcher, Fists    
  - Screecher
  - Skinthief
  - Ventrilokar
  - Warrior with one of the following options:
    - Bolt pistol, Chainsword
    - Boltgun, Fists
  
' WHERE killteamid = 'CHAOS-NC';

/***********************************/
/*  Plague Marines  */
/***********************************/
UPDATE Killteam SET composition =
'A PLAGUE MARINES KillTeam is composed of:

- 1 PLAGUE MARINE CHAMPION operative
- 5 PLAGUE MARINE operatives selected from the following list:
  - BOMBARDIER
  - FIGHTER
  - HEAVY GUNNER
  - ICON BEARER
  - MALIGNANT PLAGUECASTER
  - WARRIOR

Your kill team can only include each operative on this list once' WHERE killteamid = 'CHAOS-PM';

/***********************************/
/*  Warp Coven  */
/***********************************/
UPDATE Killteam SET composition =
'A WARP COVEN KillTeam is composed of 6 WARPCOVEN operatives selected from the following list:

- SORCERER OF DESTIN *(1)*
- SORCERER OF TEMPYRION *(1)*
- SORCERER OF WARPFIRE *(1)*
- RUBRIC MARINE GUNNER with one of the following options:
  - Warpflamer; fists
  - Soulreaper cannon *(2)*; fists
- RUBRIC MARINE ICON BEARER
- RUBRIC MARINE WARRIOR
- TZAANGOR CHAMPION *(3)* with one of the following options:
  - Greataxe
  - Greatblade
- TZAANGOR HORN BEARER *(3)*
- TZAANGOR ICON BEARER *(3)*
- TZAANGOR WARRIOR *(3)* with one of the following options:
- Tzaangor blades
  - Tzaangor blade & shield
  - Autopistol; chainsword

**(1):** With force stave, PSYCHIC weapons on their datacard and one of the following options:
- Inferno bolt pistol
- Prosperine khopesh
- Warpflame pistol

**(2):** Your kill team can only include up to one warpflame pistol and up to one soulreaper cannon.  

**(3):** These operatives count as half a selection each.  

You must select at least one friendly SORCERER operative, and one of your selected SORCERER operatives must have the LEADER keyword for the battle.
Add 1 to that LEADER operative''s Wounds stat for the battle.  

Other than WARRIOR and GUNNER operatives, your kill team can only include each operative on this list once.  

Your kill team can only include up to two GUNNER operatives.' WHERE killteamid = 'CHAOS-WC';

/***********************************/
/*  Exaction Squad  */
/***********************************/
UPDATE Killteam SET composition =
'An EXACTION SQUAD KillTeam is composed of:

- 1 EXACTION SQUAD PROCTOR-EXACTANT operative with one of the following options:
  - Combat shotgun; repression baton
  - Shotpistol; dominator maul & assault shield
- 10 EXACTION SQUAD operatives selected from the following list:
  - CASTIGATOR
  - CHIRURGANT
  - LEASHMASTER
  - R-VR CYBER-MASTIFF
  - MALOCATOR
  - MARKSMAN
  - REVELATUM
  - SUBDUCTOR
  - VIGILANT
  - VOX-SIGNIFIER
  - GUNNER with one of the following options:
    - Grenade launcher; repression baton
    - Heavy stubber; repression baton
    - Webber; repression baton
        

  

Other than GUNNER, SUBDUCTOR and VIGILANT operatives, your kill team can only include each operative on this list once.  

Your kill team can only include up to two GUNNER operatives (each must have a different option) and up to four SUBDUCTOR operatives.' WHERE killteamid = 'IMP-AES';

/***********************************/
/*  Angels Of Death  */
/***********************************/
UPDATE Killteam SET composition =
'An ANGELS OF DEATH KillTeam is composed of:
 
- 1 ANGEL OF DEATH operative selected from the following list:
  - ASSAULT INTERCESSOR SERGEANT with one option from each of the following:
    - Hand flamer or heavy bolt pistol
    - Chainsword, power fist, power weapon or thunder hammer  
    - Or the following option:
      - Plasma pistol; chainsword
  - INTERCESSOR SERGEANT with one option  from each of the following:
    - Auto bolt rifle, bolt rifle or stalker bolt rifle
    - Chainsword, fists, power fist, power weapon or thunder hammer
  - SPACE MARINE CAPTAIN
- 5 ANGEL OF DEATH operatives selected from the following list:
  - ASSAULT INTERCESSOR GRENADIER
  - ASSAULT INTERCESSOR WARRIOR
  - ELIMINATOR SNIPER*
  - HEAVY INTERCESSOR GUNNER*
  - INTERCESSOR GUNNER with auxiliary grenade launcher and one of the following options:
    - Auto bolt rifle; fists
    - Bolt rifle; fists
    - Stalker bolt rifle; fists    
  - INTERCESSOR WARRIOR with one of the following options:
    - Auto bolt rifle; fists
    - Bolt rifle; fists
    - Stalker bolt rifle; fists

Other than WARRIOR operatives, your kill team can only include each operative on this list once.  
*You cannot select more than one of these operatives combined.

Some ANGEL OF DEATH rules refer to a ''bolt weapon''. This is a ranged weapon that includes ''bolt'' in its name, e.g. stalker bolt rifle, heavy bolt pistol, etc.' WHERE killteamid = 'IMP-AOD';

/***********************************/
/*  Battleclade  */
/***********************************/
UPDATE Killteam SET composition =
'A BATTLECLADE KillTeam is composed of:

- 1 BATTLECLADE TECHNOARCHEOLOGIST
- 1 BATTLECLADE SERVITOR UNDERSEER
- 8 BATTLECLADE operatives selected from the following list:
  - AUTO-PROXY SERVITOR
  - BREACHER SERVITOR
  - COMBAT SERVITOR with one of the following options:
    - Servo-claw; incendine igniter
    - Servo-claw; meltagun
    - Servo-claw; phosphor blaster
  - GUN SERVITOR with heavy arc rifle and augmetic claw
  - GUN SERVITOR with heavy bolter and augmetic claw
  - TECHNOMEDIC SERVITOR

Other than COMBAT SERVITOR operatives, your kill team can only include each operative on this list once.
Your kill team can only include up to one COMBAT SERVITOR operative with meltagun, and it can only include up to three COMBAT SERVITOR operatives with incendine igniter.' WHERE killteamid = 'IMP-BC';

/***********************************/
/*  Death Korps  */
/***********************************/
UPDATE Killteam SET composition =
'A DEATH KORPS KillTeam is composed of:

- 1 DEATH KORPS WATCHMASTER operative with the following:
  - Boltgun; bayonet  
  Or one option from each of the following:
  - Bolt pistol, plasma pistol or relic laspistol
  - Chainsword or power weapon
- 4 TROOPER operatives*
- 9 DEATH KORPS operatives selected from the following list:
  - BRUISER
  - CONFIDANT with one of the following options:
    - Boltgun or lasgun; bayonet
    - Bolt pistol or relic laspistol; chainsword    
  - GUNNER with bayonet and flamer
  - GUNNER with bayonet and grenade launcher
  - GUNNER with bayonet and meltagun
  - GUNNER with bayonet and plasma gun
  - MEDIC
  - SAPPER
  - SNIPER
  - SPOTTER
  - TROOPER
  - VETERAN
  - VOX-OPERATOR
  - ZEALOT

Other than TROOPER operatives, your kill team can only include each operative on this list once.  

*Up to four times, instead of taking one of these TROOPER operatives, you can select one DEATH KORPS ploy to cost you 0CP for the battle.' WHERE killteamid = 'IMP-DKK';

/***********************************/
/*  Elucidian Starstriders  */
/***********************************/
UPDATE Killteam SET composition =
'Note that you do not select your operatives from a list.
This kill team’s operatives are specified.

An ELUCIDIAN STARSTRIDERS killteam is composed of every ELUCIDIAN STARSTRIDER operative in the following list:

- 1 ELUCIA VHANE
- 1 CANID
- 1 DEATH CULT EXECUTIONER
- 1 LECTRO-MAESTER
- 1 REJUVENAT ADEPT
- 1 VOIDMASTER
- 3 VOIDSMAN with lasgun and gun butt
- 1 VOIDSMAN with rotor cannon and gun butt
' WHERE killteamid = 'IMP-ESS';

/***********************************/
/*  Hunter Clade  */
/***********************************/
UPDATE Killteam SET composition =
'A HUNTER CLADE killteam is composed of:

- 1 HUNTER CLADE operative selected from the following list:
  - SICARIAN INFILTRATOR PRINCEPS with one option from each of the following:
    - Flechette blaster or stubcarbine
    - Power weapon or taser goad
  - SICARIAN RUSTSTALKER PRINCEPS
  - SKITARII RANGER ALPHA with one of the following options:
    - Galvanic rifle; gun butt
      - Master-crafted radium pistol; power weapon  
    Or one option from each of the following:
    - Arc pistol or phosphor blast pistol
    - Arc maul or taser goad
  - SKITARII VANGUARD ALPHA with one of the following options:
    - Radium carbine; gun butt
    - Master-crafted radium pistol; power weapon  
    Or one option from each of the following:
    - Arc pistol or phosphor blast pistol
    - Arc maul or taser goad
- 9 HUNTER CLADE operatives selected from the following list:
  - SICARIAN INFILTRATOR WARRIOR* with one option from each of the following:
    - Flechette blaster or stubcarbine
    - Power weapon or taser goad
  - SICARIAN RUSTSTALKER WARRIOR* with one of the following options:
    - Chordclaw & transonic razor
    - Transonic blades
  - SKITARII RANGER DIKTAT
  - SKITARII RANGER GUNNER* with gun butt and one of the following options:
    - Arc rifle, plasma caliver or transuranic arquebus
  - SKITARII RANGER SURVEYOR
  - SKITARII RANGER WARRIOR
  - SKITARII VANGUARD DIKTAT
  - SKITARII VANGUARD GUNNER* with gun butt and one of the following options:
    - Arc rifle, plasma caliver or transuranic arquebus    
  - SKITARII VANGUARD SURVEYOR
  - SKITARII VANGUARD WARRIOR


*You cannot select more than 6 of these operatives combined.  

Other than GUNNER and WARRIOR operatives, your kill team can only include each operative on this list once.
Your kill team can only include up to one DIKTAT operative, up to one SURVEYOR operative and up to five SICARIAN operatives.  

Your kill team can only include up to one arc rifle, up to one plasma caliver and up to one transuranic arquebus.' WHERE killteamid = 'IMP-HC';

/***********************************/
/*  Imperial Navy Breachers  */
/***********************************/
UPDATE Killteam SET composition =
'An IMPERIAL NAVY BREACHERS killteam is composed of:
- 1 IMPERIAL NAVY BREACHER SERGEANT-AT-ARMS operative with the following:  
  - Navis shotgun and Navis hatchet  
  Or one option from each of the following:  
  - Bolt pistol or heirloom autopistol
  - Chainsword or power weapon
- 10 IMPERIAL NAVY BREACHER operatives selected from the following list:
  - ARMSMAN
  - AXEJACK
  - C.A.T. UNIT
  - ENDURANT
  - GHEISTSKULL
  - GRENADIER
  - GUNNER with Navis las-volley and gun butt
  - GUNNER with meltagun and gun butt
  - GUNNER with plasma gun and gun butt
  - HATCHCUTTER
  - SURVEYOR
  - VOID-JAMMER

Other than ARMSMAN operatives, your kill team can only include each operative on this list once. Your kill team can only include up to two GUNNER operatives.  

Your kill team can only include a GHEISTSKULL operative if it also includes a VOID-JAMMER operative, and it can only include a C.A.T. UNIT operative if it also includes a SURVEYOR operative.  

These operatives count as half a selection each, meaning you can select both of them and it’s treated as one selection in total.' WHERE killteamid = 'IMP-INB';

/***********************************/
/*  Inquisitorial Agents  */
/***********************************/
UPDATE Killteam SET composition =
'An INQUISITORIAL AGENTS killteam is composed of:

- 1 INQUISITORIAL AGENT INTERROGATOR operative
- 1 INQUISITORIAL AGENT TOME-SKULL operative
- 5 INQUISITORIAL AGENT operatives selected from the following list:
  - AUTOSAVANT
  - QUESTKEEPER
  - DEATH WORLD VETERAN
  - ENLIGHTENER
  - HEXORCIST
  - MYSTIC
  - PENAL LEGIONNAIRE
  - PISTOLIER
  - GUN SERVITOR with one of the following options:
    - Heavy bolter; servo-claw
    - Multi-melta; servo-claw
    - Plasma cannon; servo-claw
- 5 INQUISITORIAL AGENT operatives selected from the list above, or REQUISITIONED operatives from one group in the Inquisitorial Requisition faction rule (you cannot select REQUISITIONED operatives from different groups).
  
Your kill team can only include each operative on this list once, unless you’re not including any REQUISITIONED operatives, in which case you can include up to two GUN SERVITOR operatives, but each one must have different options.  

Your kill team (including any REQUISITIONED operatives) cannot include more than one weapon with the Piercing 2 weapon rule, and cannot include more than three weapons with the Piercing X (excluding Piercing Crits X) weapon rule combined.' WHERE killteamid = 'IMP-INQ';

/***********************************/
/*  Kasrkin  */
/***********************************/
UPDATE Killteam SET composition =
'A KASRKIN KillTeam is composed of:

- 1 KASRKIN SERGEANT operative with one of the following options:
  - Bolt pistol; power weapon
  - Hot-shot lasgun; gun butt
  - Hot-shot laspistol; power weapon
  - Plasma pistol; chainsword
- 9 KASRKIN operatives selected from the following list:
  - COMBAT MEDIC
  - DEMO-TROOPER
  - GUNNER with flamer and gun butt*
  - GUNNER with grenade launcher and gun butt*
  - GUNNER with hot-shot volley gun and gun butt*
  - GUNNER with meltagun and gun butt*
  - GUNNER with plasma gun and gun butt*
  - RECON-TROOPER
  - SHARPSHOOTER*
  - TROOPER
  - VOX-TROOPER

Other than TROOPER operatives, your kill team can only include each operative on this list once.  

*You cannot select more than four of these operatives combined.  

Some KASRKIN rules refer to a ‘hot-shot weapon’. This is a ranged weapon that includes ‘hot-shot’ in its name, e.g. hot-shot lasgun, all profiles of a hot-shot marksman rifle, etc.' WHERE killteamid = 'IMP-KAS';

/***********************************/
/*  Novitiates  */
/***********************************/
UPDATE Killteam SET composition =
'A NOVITIATES killteam is composed of:

- 1 NOVITIATE SUPERIOR operative with one of the following options:
  - Plasma pistol; power weapon
  - Relic boltgun; gun butt
  - Relic bolt pistol; power weapon
- 9 NOVITIATE operatives selected from the following list:
  - CONDEMNOR
  - DIALOGUS
  - DUELLIST
  - EXACTOR
  - HOSPITALLER
  - PENITENT
  - PRECEPTOR
  - PRONATUS
  - PURGATUS
  - RELIQUARIUS
  - MILITANT with one of the following options:
    - Autopistol; Novitiate blade
    - Autogun; gun butt

Other than MILITANT and PURGATUS operatives, your kill team can only include each operative on this list once.  

Your kill team can only include up to two PURGATUS operatives.' WHERE killteamid = 'IMP-NOV';

/***********************************/
/*  Phobos Strike Team  */
/***********************************/
UPDATE Killteam SET composition =
'A PHOBOS STRIKE TEAM KillTeam is composed of:

- 1 PHOBOS STRIKE TEAM operative selected from the following list:
  - INFILTRATOR SERGEANT
  - INCURSOR SERGEANT
  - REIVER SERGEANT with one of the following options:
    - Special issue bolt pistol; combat knife
    - Bolt carbine; fists
- 5 PHOBOS STRIKE TEAM operatives selected from the following list:
  - INFILTRATOR COMMSMAN
  - INFILTRATOR HELIX ADEPT
  - INFILTRATOR SABOTEUR
  - INFILTRATOR VETERAN
  - INFILTRATOR VOXBREAKER
  - INFILTRATOR WARRIOR
  - INCURSOR MARKSMAN
  - INCURSOR MINELAYER
  - INCURSOR WARRIOR
  - REIVER WARRIOR with one of the following options:
    - Special issue bolt pistol; combat knife
    - Bolt carbine; fists

Other than WARRIOR operatives, your kill team can only include each operative on this list once.' WHERE killteamid = 'IMP-PHO';

/***********************************/
/*  Ratlings  */
/***********************************/
UPDATE Killteam SET composition =
'A RATLING KillTeam is composed of:

- 1 RATLING FIXER operative with one of the following options:  
  - Battle Rifle, Fists
  - Sniper Rifle, Fists
- 10 RATLING operatives selected from the following list:
  - BATTLEMUTT
  - BULLGRYN* with one from each of the following:
    - Grenadier Gauntlet or Power Maul
    - Brute Shield or Slabshield  
  - OGRYN*
  - BIG SHOT
  - BOMBER
  - HARDBIT
  - RAIDER
  - SNEAK
  - SNIPER
  - SPOTTER
  - STASHMASTER
  - VOX-THIEF

*You cannot select more than three of these operatives combined. Up to three times, instead of selecting one of these operatives, you can select one RATLING ploy to cost you 0CP for the battle.  

Other than BULLGRYN, OGRYN, and SNIPER operatives, your KillTeam can only include each operative above once.' WHERE killteamid = 'IMP-RAT';

/***********************************/
/*  Sanctifiers  */
/***********************************/
UPDATE Killteam SET composition =
'A SANCTIFIER kill team is composed of:

- 1 SANCTIFIER CONFESSOR
- 1 SANCTIFIER CHERUB
- 9 SANCTIFIER operatives selected from the following list:
  - CONFLAGRATOR
  - DEATH CULT ASSASSIN
  - DRILL ABBOT
  - MIRACULIST
  - MISSIONARY with one of the following options:
    - Ministorum flamer; brazier of holy fire
    - Ministorum flamer; gun butt; holy relic
  - MISSIONARY with one of the following options:
    - Meltagun; chainsword; holy relic
    - Plasma gun; chainsword; brazier of holy fire
  - PERSECUTOR
  - PREACHER
  - RELIQUANT
  - SALVATIONIST

Other than PREACHER operatives, your kill team can only include each operative above once.  

Your kill team can only include up to four PREACHER operatives.  

You cannot select an option that includes a brazier of holy fire more than once per battle.' WHERE killteamid = 'IMP-SANC';

/***********************************/
/*  Scout Squad  */
/***********************************/
UPDATE Killteam SET composition =
'A SCOUT SQUAD killteam is composed of:

- 1 SCOUT SQUAD Sergeant operative with one of the following options:
  - Astartes shotgun, fists
  - Boltgun, fists
  - Bolt Pistol, Chainsword
- 8 SCOUT SQUAD operatives selected from the following list:
  - Heavy Gunner with Fists, Bolt Pistol and Heavy Bolter
  - Heavy Gunner with Fists, Bolt Pistol and Missile Launcher
  - Hunter
  - Sniper
  - Tracker
  - Warrior with one of the following options:
    - Astartes Shotgun, fists
    - Boltgun, Fists
    - Bolt Pistol, Combat Blade

Other than Warrior operatives, your Killteam can only include each operative once.' WHERE killteamid = 'IMP-SCT';

/***********************************/
/*  Tempestus Aquilon  */
/***********************************/
UPDATE Killteam SET composition =
'A TEMPESTUS AQUILON KillTeam is composed of:

- 1 TEMPESTUS AQUILON TEMPESTOR operative with one of the following options:
  - Hot-Shot Laspistol; Power Weapon
  - Relic Bolt Pistol; Chainsword
  - Hot-Shot Lascarbine; Fists
- 1 SERVO-SENTRY with one of the following options:
  - Flamer
  - Grenade Launcher
  - Hot-Shot Volley Gun
- 9 TEMPESTUS AQUILON operatives selected from the following list:
  - GRENADIER
  - GUNFIGHTER
  - GUNNER with Melta Carbine and Fists
  - GUNNER with Plasma Carbine and Fists
  - MARKSMAN
  - PRECURSOR
  - TROOPER

Other than TROOPER operatives, your killteam can only include each operative above once.' WHERE killteamid = 'IMP-TEMPAQ';

/***********************************/
/*  Hierotek Circle  */
/***********************************/
UPDATE Killteam SET composition =
'A HIEROTEK CIRCLE KillTeam is composed of:

- 1 HIEROTEK CIRCLE operative selected from the following list:
  - CHRONOMANCER operative with one of the following options:
    - Aeonstave
    - Entropic lance
  - PSYCHOMANCER
  - TECHNOMANCER
- 1 PLASMACYTE ACCELERATOR operative
- 1 PLASMACYTE REANIMATOR operative
- 5 HIEROTEK CIRCLE operatives selected from the following list:
  - APPRENTEK
  - DEATHMARK
  - DESPOTEK with one of the following options:
    - Gauss blaster; bayonet
    - Tesla carbine; bayonet    
  - GUARDIAN with one of the following options:
    - Gauss blaster; bayonet
    - Tesla carbine; bayonet
        
Other than DEATHMARK and GUARDIAN operatives, your kill team can only include each operative on this list once.' WHERE killteamid = 'NEC-HIER';

/***********************************/
/*  Kommandos  */
/***********************************/
UPDATE Killteam SET composition =
'A KOMMANDOS KillTeam is composed of:

- 1 KOMMANDO Boss Nob operative with one of the following options:
  - Slugga; Big Choppa
  - Slugga; Power Klaw
- 9 KOMMANDO operatives selected from the following list:
  - Bomb Squig (X)
  - Boy
  - Breacha Boy
  - Burna Boy
  - Comms Boy
  - Dakka Boy
  - Grot (X)
  - Rokkit Boy
  - Slasha Boy
  - Snipa Boy

Other than BOY operatives, your kill team can only include each operative on this list once.  

(X) These operatives count as half a selection each, meaning you can select both of them and it''s treated as one selection in total.' WHERE killteamid = 'ORK-KOM';

/***********************************/
/*  Wrecka Krew  */
/***********************************/
UPDATE Killteam SET composition =
'A WRECKA KREW KillTeam is composed of:

- 1 WRECKA KREW BOSS NOB operative with one of the following options:
  - Rokkit Pistol; Smash Hammer
  - Two Rokkit Pistols; Choppa
- 2 WRECKA KREW BOMB SQUIG operatives
- 5 WRECKA KREW operatives selected from the following list:
  - BREAKA BOY DEMOLISHA
  - BREAKA BOY FIGHTER
  - BREAKA BOY KRUSHA
  - TANKBUSTA GUNNER with one of the following options:
    - ''Eavy Rokkit Launcha; Fists
    - Rokkit Launcha; Fists    
  - TANKBUSTA ROKKITEER with one of the following options:
    - Rokkit Launcha; Pusla Rokkit; Fists
    - Rokkit Launcha; Rokkit Rack; Fists

Other than BOMB SQUIG, BREAKA BOY FIGHTER, and TANKBUSTA GUNNER operatives, your KillTeam can only include each operative above once.' WHERE killteamid = 'ORK-WK';

/***********************************/
/*  Farstalker Kinband  */
/***********************************/
UPDATE Killteam SET composition =
'A FARSTALKER KINBAND killteam is composed of:

- 1 FARSTALKER KINBAND KILL-BROKER operative with one of the following options:
  - Kroot rifle; ritual blade
  - Pulse weapon; ritual blade
- 11 FARSTALKER KINBAND operatives selected from the following list:
  - BOW-HUNTER
  - COLD-BLOOD
  - CUT-SKIN
  - HOUND
  - LONG-SIGHT
  - PISTOLIER
  - STALKER
  - TRACKER
  - HEAVY GUNNER with one of the following options:
    - Dvorgite skinner; blade
    - Londaxi tribalest; blade    
  - WARRIOR with one of the following options:
    - Kroot rifle; blade
    - Kroot scattergun; blade
        
Other than HOUND and WARRIOR operatives, your kill team can only include each operative on this list once. Your kill team can only include up to two HOUND operatives.' WHERE killteamid = 'TAU-FSKB';

/***********************************/
/*  Pathfinders  */
/***********************************/
UPDATE Killteam SET composition =
'A PATHFINDERS KillTeam is composed of:

- 1 PATHFINDER SHAS’UI operative
- 11 PATHFINDER operatives selected from the following list:
  - ASSAULT GRENADIER
  - BLOODED
  - COMMS SPECIALIST
  - DRONE CONTROLLER
  - MARKSMAN
  - MEDICAL TECHNICIAN
  - SHAS’LA
  - TRANSPECTRAL INTERFERENCE
  - MB3 RECON DRONE (counts as two selections)
  - MV31 PULSE ACCELERATOR DRONE
  - MV33 GRAV-INHIBITOR DRONE
  - MV1 GUN DRONE
  - MV4 SHIELD DRONE
  - MV7 MARKER DRONE
  - WEAPONS EXPERT with one of the following:
    - Ion rifle; gun butt
    - Rail rifle; gun butt
        
Other than SHAS’LA and WEAPONS EXPERT operatives, your kill team can only include each operative on this list once.  

Your kill team can only include up to two WEAPONS EXPERT operatives.  

Some PATHFINDER rules refer to a ‘pulse weapon’. The following weapons are pulse weapons: burst cannon, pulse carbine, suppressed pulse carbine, twin pulse carbine.' WHERE killteamid = 'TAU-PF';

/***********************************/
/*  Vespid Stingwings  */
/***********************************/
UPDATE Killteam SET composition =
'A VESPID STINGWINGS killteam is composed of:

- 1 VESPID STINGWING STRAIN LEADER operative
- 1 VESPID STINGWING OVERSIGHT DRONE operative
- 9 VESPID STINGWING operatives selected from the following list:
  - LONGSTING
  - SHADESTRAIN
  - SKYBLAST
  - SWARMGUARD
  - WARRIOR

Other than WARRIOR operatives, your killteam can only include each operative above once.' WHERE killteamid = 'TAU-VESP';

/***********************************/
/*  Brood Brothers  */
/***********************************/
UPDATE Killteam SET composition =
'A BROOD BROTHER KillTeam is composed of:

- 1 BROOD BROTHER Commander operative with one of the following options:
  - Bolt pistol, chainsword and claw
  - Drum-fed autogun, bayonet,
  - Laspistol, power weapon and claw=
- 9 BROOD BROTHER operatives selected from the following list:
  - Agitator
  - Gunner with Flamer and bayonet (1)
  - Gunner with Grenade Launcher and bayonet (1)
  - Gunner with Meltagun and bayonet (1)
  - Gunner with Plasma gun and bayonet (1)
  - Iconward
  - Knife Fighter
  - Medic
  - Sapper
  - Sniper (1)
  - Trooper
  - Veteran
  - Vox-Operator
- 3 Brood Brother operatives selected from the following list (3):
  - 2 Psychic Familiar operatives (Still count as one selection)
  - Magus (Count as two selections) (2)
  - Patriarch (Count as three selections) (2)
  - Primus (Count as two selections) (2)
  - Trooper

Other than Trooper operatives, your kill team can only include each option on this list once.  

(1) You cannot select more than three of these operatives combined.  

(2) Your Kill team can only include up to one BROODCOVEN operative. If one of these operatives is selected for deployment, your Commander operative loses the Leader keyword for the battle.  

(3) Up to three times, instead of selecting one of these operatives, you can select one BROOD BROTHER ploy to cost you 0CP for the battle. Note that "count as" selections still apply; for example, if you select a Patriarch operative, you could not do this.' WHERE killteamid = 'TYR-BBRO';

/***********************************/
/*  Raveners  */
/***********************************/
UPDATE Killteam SET composition =
'A RAVENERS KillTeam  is composed of:

- 1 RAVENER PRIME
- 4 RAVENER operatives selected from the following list:
  - FELLTALON
  - TREMORSCYTHE
  - VENOMSPITTER
  - WARRIOR
  - WRECKER

Other than WARRIOR operatives, your KillTeam can only include each operative on this list once.' WHERE killteamid = 'TYR-RAV';

/***********************************/
/*  Wyrmblade  */
/***********************************/
UPDATE Killteam SET composition =
'A WYRMBLADE killteam is composed of:

- 1 WYRMBLADE NEOPHYTE LEADER operative with one of the following options:  
  - Autogun; gun butt
  - Shotgun; gun butt  
  Or one option from each of the following:
  - Bolt pistol, master-crafted autopistol or web pistol
  - Chainsword, power maul or power pick
- 13 WYRMBLADE operatives selected from the following list: 
  - KELERMORPH*
  - LOCUS*
  - GUNNER with flamer and gun butt
  - GUNNER with grenade launcher and gun butt
  - GUNNER with webber and gun butt
  - HEAVY GUNNER with heavy stubber and gun butt
  - HEAVY GUNNER with mining laser and gun butt
  - HEAVY GUNNER with seismic cannon and gun butt
  - ICON BEARER with one of the following options:
      - Autogun; gun butt
      - Shotgun; gun butt
  - SANCTUS SNIPER*
  - SANCTUS TALON*
  - WARRIOR with one of the following options:
      - Autogun; gun butt
      - Shotgun; gun butt

*These operatives count as two selections each.  
Other than WARRIOR operatives, your kill team can only include each operative on this list once.  

Your kill team can only include up to two GUNNER operatives, up to two HEAVY GUNNER operatives and up to two CULT AGENT operatives.' WHERE killteamid = 'TYR-WB';

/***********************************/
/*  Hearthkyn Salvagers  */
/***********************************/
UPDATE Killteam SET composition =
'A HEARTHKYN SALVAGERS KillTeam is composed of:

- 1 HEARTHKYN SALVAGER THEYN operative with one option from each of the following:
  - Autoch-pattern bolt pistol, Autoch-pattern bolter, bolt revolver, EtaCarn plasma pistol, ion blaster or ion pistol
  - Concussion gauntlet or plasma weapon
- 9 HEARTHKYN SALVAGER operatives selected from the following list:
  - DÔZR
  - FIELD MEDIC
  - GRENADIER
  - JUMP PACK WARRIOR
  - KINLYNK*
  - KOGNITÂAR*
  - LOKÂTR*
  - LUGGER*
  - WARRIOR*
  - GUNNER with one of the following options:
    - EtaCarn plasma beamer; fists
    - HYLas auto rifle; fists
    - HYLas rotary cannon; fists
    - L7 missile launcher; fists
    - Magna rail rifle; fists

Other than GUNNER and WARRIOR operatives, your kill team can only include each operative on this list once.  

Your kill team can only include up to three GUNNER operatives (each must have a different option).

*With one of the following options:

- Autoch-pattern bolter; fists
- Ion blaster; fists
' WHERE killteamid = 'VOT-HKS';

/***********************************/
/*  Hernkyn Yaegirs  */
/***********************************/
UPDATE Killteam SET composition =
'A HERNKYN YAEGIR killteam is composed of:

- 1 HERNKYN YAEGIR Theyn operative
- 9 HERNKYN YAEGIR operatives selected from the following list:
  - Bladekyn
  - Bombast
  - Gunner
  - Ironbreak
  - Riflekyn
  - Tracker
  - Warrior with one of the following options:
    - Bolt Revolver, plasma knife
    - Bolt Shotgun, Fists
Other than Warrior operatives, your kill team can only include each operative on this list once.' WHERE killteamid = 'VOT-HKY';

```
