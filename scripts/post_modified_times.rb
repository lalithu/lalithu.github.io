require "fileutils"
require "json"
require "open3"
require "time"
require "yaml"

source = File.expand_path("..", __dir__)
config = YAML.load_file(File.join(source, "_config.yml"))
ENV["TZ"] = config.fetch("timezone", "UTC")
dates = {}

Dir.glob(File.join(source, "_posts", "**", "*")).select { |path| File.file?(path) }.each do |path|
  relative_path = path.delete_prefix(source + "/")
  timestamp, status = Open3.capture2(
    "git", "-C", source, "log", "-1", "--follow", "--format=%cI",
    "--", relative_path
  )
  abort "Could not read Git history for #{relative_path}" unless status.success?

  # New local posts have no commit yet. Their saved time is a preview fallback.
  modified = timestamp.strip.empty? ? File.mtime(path) : Time.iso8601(timestamp.strip)
  dates[relative_path] = modified.getlocal.iso8601
end

FileUtils.mkdir_p(File.join(source, "_data"))
File.write(File.join(source, "_data", "post_modified_times.json"), JSON.pretty_generate(dates) + "\n")
