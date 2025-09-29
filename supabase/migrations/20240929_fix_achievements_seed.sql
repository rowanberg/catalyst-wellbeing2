-- Insert Achievement Templates with engaging content
INSERT INTO achievement_templates (title, description, category, type, rarity, icon, color, requirements, rewards, max_progress) VALUES

-- Academic Achievements
('First Steps', 'Complete your first quest', 'academic', 'badge', 'common', '🎯', 'blue', '["complete_quest"]', '{"xp": 50, "gems": 10}', 1),
('Quest Master', 'Complete 10 quests', 'academic', 'badge', 'rare', '🏆', 'blue', '["complete_10_quests"]', '{"xp": 200, "gems": 50, "title": "Quest Master"}', 10),
('Learning Streak', 'Maintain a 7-day learning streak', 'academic', 'trophy', 'epic', '🔥', 'orange', '["7_day_streak"]', '{"xp": 300, "gems": 75}', 7),
('Knowledge Seeker', 'Earn 1000 XP', 'academic', 'medal', 'rare', '📚', 'blue', '["earn_1000_xp"]', '{"xp": 100, "gems": 100}', 1000),
('Homework Hero', 'Submit homework on time for 5 days', 'academic', 'badge', 'common', '📝', 'green', '["homework_streak_5"]', '{"xp": 150, "gems": 30}', 5),
('Perfect Score', 'Get 100% on any assessment', 'academic', 'trophy', 'epic', '💯', 'gold', '["perfect_score"]', '{"xp": 500, "gems": 100, "title": "Perfectionist"}', 1),

-- Social Achievements
('Friendly Helper', 'Help 3 classmates', 'social', 'badge', 'common', '🤝', 'green', '["help_classmates_3"]', '{"xp": 100, "gems": 25}', 3),
('Team Player', 'Participate in 5 group activities', 'social', 'badge', 'rare', '👥', 'green', '["group_activities_5"]', '{"xp": 200, "gems": 50}', 5),
('Class Leader', 'Lead a class discussion', 'social', 'trophy', 'epic', '👑', 'purple', '["lead_discussion"]', '{"xp": 300, "gems": 75, "title": "Class Leader"}', 1),
('Peer Mentor', 'Tutor another student', 'social', 'medal', 'rare', '🎓', 'blue', '["peer_tutoring"]', '{"xp": 250, "gems": 60}', 1),

-- Wellness Achievements
('Mood Tracker', 'Log your mood for 7 consecutive days', 'wellness', 'badge', 'common', '😊', 'pink', '["mood_log_7_days"]', '{"xp": 100, "gems": 20}', 7),
('Mindful Moments', 'Complete 10 mindfulness exercises', 'wellness', 'badge', 'rare', '🧘', 'purple', '["mindfulness_10"]', '{"xp": 200, "gems": 40}', 10),
('Wellness Warrior', 'Complete all daily wellness activities for a week', 'wellness', 'trophy', 'epic', '💪', 'pink', '["wellness_week"]', '{"xp": 400, "gems": 80, "title": "Wellness Warrior"}', 7),
('Gratitude Master', 'Write 30 gratitude entries', 'wellness', 'medal', 'rare', '🙏', 'yellow', '["gratitude_30"]', '{"xp": 300, "gems": 60}', 30),
('Sleep Champion', 'Log healthy sleep for 14 days', 'wellness', 'trophy', 'epic', '😴', 'blue', '["sleep_14_days"]', '{"xp": 350, "gems": 70}', 14),

-- Creativity Achievements
('Creative Spark', 'Submit your first creative project', 'creativity', 'badge', 'common', '🎨', 'purple', '["first_creative_project"]', '{"xp": 75, "gems": 15}', 1),
('Art Explorer', 'Try 5 different creative activities', 'creativity', 'badge', 'rare', '🖌️', 'purple', '["creative_activities_5"]', '{"xp": 200, "gems": 45}', 5),
('Innovation Award', 'Create an original project', 'creativity', 'trophy', 'epic', '💡', 'yellow', '["original_project"]', '{"xp": 400, "gems": 90, "title": "Innovator"}', 1),
('Digital Artist', 'Complete 3 digital art projects', 'creativity', 'medal', 'rare', '🖥️', 'cyan', '["digital_art_3"]', '{"xp": 250, "gems": 55}', 3),

-- Leadership Achievements
('Voice of Change', 'Participate in student council', 'leadership', 'badge', 'rare', '🗳️', 'red', '["student_council"]', '{"xp": 300, "gems": 70}', 1),
('Event Organizer', 'Help organize a school event', 'leadership', 'trophy', 'epic', '🎪', 'orange', '["organize_event"]', '{"xp": 500, "gems": 100, "title": "Event Master"}', 1),
('Mentor Badge', 'Mentor 3 younger students', 'leadership', 'medal', 'epic', '🌟', 'gold', '["mentor_3_students"]', '{"xp": 400, "gems": 85}', 3),
('Initiative Taker', 'Start a new club or activity', 'leadership', 'trophy', 'legendary', '🚀', 'rainbow', '["start_club"]', '{"xp": 1000, "gems": 200, "title": "Pioneer"}', 1),

-- Special Achievements
('Early Bird', 'Log in before 8 AM for 5 days', 'special', 'badge', 'common', '🌅', 'orange', '["early_login_5"]', '{"xp": 100, "gems": 25}', 5),
('Night Owl', 'Complete evening reflection for 10 days', 'special', 'badge', 'rare', '🦉', 'purple', '["evening_reflection_10"]', '{"xp": 150, "gems": 35}', 10),
('Gem Collector', 'Collect 500 gems', 'special', 'trophy', 'epic', '💎', 'cyan', '["collect_500_gems"]', '{"xp": 200, "gems": 100}', 500),
('XP Master', 'Reach level 10', 'special', 'medal', 'epic', '⚡', 'yellow', '["reach_level_10"]', '{"xp": 500, "gems": 150, "title": "XP Master"}', 10),
('Consistency King', 'Use the platform for 30 consecutive days', 'special', 'trophy', 'legendary', '👑', 'gold', '["30_day_streak"]', '{"xp": 1000, "gems": 250, "title": "Consistency King"}', 30),
('Pet Lover', 'Feed your virtual pet 50 times', 'special', 'badge', 'rare', '🐱', 'pink', '["feed_pet_50"]', '{"xp": 200, "gems": 50}', 50),
('Safety First', 'Complete all digital citizenship modules', 'special', 'medal', 'epic', '🛡️', 'blue', '["digital_citizenship_complete"]', '{"xp": 400, "gems": 80, "title": "Digital Citizen"}', 1);

-- Insert Milestone Templates
INSERT INTO milestone_templates (title, description, category, icon, color, target_value, data_source, rewards) VALUES

-- XP Milestones
('XP Novice', 'Earn your first 100 XP', 'academic', '⚡', 'blue', 100, 'total_xp', '{"xp": 50, "gems": 20}'),
('XP Apprentice', 'Earn 500 XP total', 'academic', '⚡', 'blue', 500, 'total_xp', '{"xp": 100, "gems": 50}'),
('XP Expert', 'Earn 1,500 XP total', 'academic', '⚡', 'blue', 1500, 'total_xp', '{"xp": 200, "gems": 100}'),
('XP Master', 'Earn 3,000 XP total', 'academic', '⚡', 'blue', 3000, 'total_xp', '{"xp": 500, "gems": 200, "achievement": "XP Legend"}'),
('XP Legend', 'Earn 5,000 XP total', 'academic', '⚡', 'gold', 5000, 'total_xp', '{"xp": 1000, "gems": 400, "achievement": "XP God"}'),

-- Quest Completion Milestones
('Quest Starter', 'Complete 5 quests', 'academic', '🎯', 'green', 5, 'quests_completed', '{"xp": 75, "gems": 25}'),
('Quest Enthusiast', 'Complete 25 quests', 'academic', '🎯', 'green', 25, 'quests_completed', '{"xp": 150, "gems": 75}'),
('Quest Champion', 'Complete 50 quests', 'academic', '🎯', 'green', 50, 'quests_completed', '{"xp": 300, "gems": 150}'),
('Quest Legend', 'Complete 100 quests', 'academic', '🎯', 'gold', 100, 'quests_completed', '{"xp": 600, "gems": 300, "achievement": "Quest Master"}'),

-- Gem Collection Milestones
('Gem Finder', 'Collect 50 gems', 'special', '💎', 'cyan', 50, 'total_gems', '{"xp": 50, "gems": 10}'),
('Gem Gatherer', 'Collect 200 gems', 'special', '💎', 'cyan', 200, 'total_gems', '{"xp": 100, "gems": 50}'),
('Gem Collector', 'Collect 500 gems', 'special', '💎', 'cyan', 500, 'total_gems', '{"xp": 200, "gems": 100}'),
('Gem Hoarder', 'Collect 1,000 gems', 'special', '💎', 'purple', 1000, 'total_gems', '{"xp": 400, "gems": 200}'),
('Gem Tycoon', 'Collect 2,500 gems', 'special', '💎', 'gold', 2500, 'total_gems', '{"xp": 1000, "gems": 500, "achievement": "Gem Master"}'),

-- Streak Milestones
('Streak Starter', 'Maintain a 3-day streak', 'wellness', '🔥', 'orange', 3, 'streak_days', '{"xp": 50, "gems": 15}'),
('Streak Builder', 'Maintain a 7-day streak', 'wellness', '🔥', 'orange', 7, 'streak_days', '{"xp": 100, "gems": 35}'),
('Streak Master', 'Maintain a 14-day streak', 'wellness', '🔥', 'red', 14, 'streak_days', '{"xp": 200, "gems": 75}'),
('Streak Legend', 'Maintain a 30-day streak', 'wellness', '🔥', 'gold', 30, 'streak_days', '{"xp": 500, "gems": 150, "achievement": "Consistency Champion"}'),

-- Level Milestones
('Level Up!', 'Reach level 2', 'academic', '🆙', 'blue', 2, 'current_level', '{"xp": 25, "gems": 10}'),
('Rising Star', 'Reach level 5', 'academic', '🌟', 'yellow', 5, 'current_level', '{"xp": 100, "gems": 50}'),
('Advanced Learner', 'Reach level 10', 'academic', '🎓', 'purple', 10, 'current_level', '{"xp": 250, "gems": 125}'),
('Expert Student', 'Reach level 20', 'academic', '👨‍🎓', 'gold', 20, 'current_level', '{"xp": 500, "gems": 250, "achievement": "Academic Excellence"}'),

-- Pet Happiness Milestones
('Pet Friend', 'Get pet to 50% happiness', 'wellness', '🐱', 'pink', 50, 'pet_happiness', '{"xp": 50, "gems": 20}'),
('Pet Buddy', 'Get pet to 75% happiness', 'wellness', '🐱', 'pink', 75, 'pet_happiness', '{"xp": 100, "gems": 40}'),
('Pet Best Friend', 'Get pet to 90% happiness', 'wellness', '🐱', 'gold', 90, 'pet_happiness', '{"xp": 200, "gems": 80, "achievement": "Pet Whisperer"}'),

-- Social Milestones
('Social Butterfly', 'Send 10 messages to family', 'social', '💬', 'green', 10, 'messages_sent', '{"xp": 75, "gems": 25}'),
('Great Communicator', 'Send 50 messages to family', 'social', '💬', 'green', 50, 'messages_sent', '{"xp": 150, "gems": 75}'),
('Family Connection', 'Send 100 messages to family', 'social', '💬', 'gold', 100, 'messages_sent', '{"xp": 300, "gems": 150, "achievement": "Family Bond"}');
