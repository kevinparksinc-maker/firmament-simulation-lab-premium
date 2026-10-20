-- Add point-in-time market assignment provenance without changing historical side order.
-- Existing records remain NULL/unknown; they must not be presented as verified favorites.
ALTER TABLE `simulation_events` ADD COLUMN `favoredTeam` varchar(180);
--> statement-breakpoint
ALTER TABLE `simulation_events` ADD COLUMN `underdogTeam` varchar(180);
--> statement-breakpoint
ALTER TABLE `simulation_events` ADD COLUMN `roleAssignmentSource` varchar(48);
--> statement-breakpoint
ALTER TABLE `simulation_events` ADD COLUMN `oddsSource` varchar(255);
