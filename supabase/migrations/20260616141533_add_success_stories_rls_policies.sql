CREATE POLICY "Public insert success_stories" ON success_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update success_stories" ON success_stories FOR UPDATE USING (true);
CREATE POLICY "Public delete success_stories" ON success_stories FOR DELETE USING (true);