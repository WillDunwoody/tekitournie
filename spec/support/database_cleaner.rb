# frozen_string_literal: true

require 'database_cleaner/active_record'

RSpec.configure do |config|
  config.before(:suite) do
    DatabaseCleaner.url_allowlist = %w[postgres://postgres:postgres@localhost:5432/rails_test postgresql://will:teki_password@localhost:5432/teki_test]
    DatabaseCleaner.clean_with(:truncation)
    DatabaseCleaner.strategy = :transaction

    DatabaseCleaner.start
  end

  config.around do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end
end
