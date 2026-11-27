require "date"
require "fileutils"
require "json"
require "open3"
require "time"
require "yaml"

source = File.expand_path("..", __dir__)
config = YAML.load_file(File.join(source, "_config.yml"))
ENV["TZ"] = config.fetch("timezone", "UTC")
shallow, status = Open3.capture2("git", "-C", source, "rev-parse", "--is-shallow-repository")
abort "Full Git history is required to determine publication timestamps" unless status.success? && shallow.strip == "false"
posts = {}

Dir.glob(File.join(source, "_posts", "**", "*")).select { |path| File.file?(path) }.each do |path|
  relative_path = path.delete_prefix(source + "/")
  history, status = Open3.capture2(
    "git", "-C", source, "log", "--follow", "--format=%H %cI",
    "--", relative_path
  )
  abort "Could not read Git history for #{relative_path}" unless status.success?
  commits = history.lines.map { |line| line.strip.split(" ", 2) }
  if commits.empty?
    posts[relative_path] = { "source" => "unpublished", "sort_date" => File.mtime(path).getlocal.iso8601 }
    next
  end

  first_commit = Time.iso8601(commits.last.last).getlocal
  original_day = Date.iso8601(File.basename(path)[0, 10])
  # Imported and pre-dated/scheduled legacy articles cannot be assigned an
  # accurate original publishing time from Git. Preserve their calendar date.
  historical = (first_commit.to_date - original_day).abs > 1
  published = historical ? original_day.iso8601 : first_commit.iso8601

  _, changed = Open3.capture2("git", "-C", source, "diff", "--quiet", "HEAD", "--", relative_path)
  abort "Could not inspect changes for #{relative_path}" if changed.exitstatus > 1
  modified = if changed.exitstatus == 1
    File.mtime(path).getlocal.iso8601
  elsif commits.length > 1
    Time.iso8601(commits.first.last).getlocal.iso8601
  end

  posts[relative_path] = {
    "published_at" => published,
    "has_publication_time" => !historical,
    "source" => historical ? "historical_date_only" : "first_commit",
    "modified_at" => modified,
    "sort_date" => historical ? published + "T00:00:00" : published
  }
end

order = posts.keys.sort_by { |path| [Time.parse(posts[path]["sort_date"]).to_i, path] }.reverse
FileUtils.mkdir_p(File.join(source, "_data"))
File.write(File.join(source, "_data", "post_dates.json"), JSON.pretty_generate({ "posts" => posts, "order" => order }) + "\n")
