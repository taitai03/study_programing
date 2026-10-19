// Ruby の受講者のコードとテストを実行するためのプログラムを組み立てる。
// 実行には ruby.wasm を使う。ブラウザでは Web Worker（ruby-client.ts）、
// 教材のテストでは Node.js（ruby-node.ts）から同じプログラムを実行する。

import type { RunResult } from "./harness";

/** ブラウザで読み込む ruby.wasm。バージョンは package.json の @ruby/* と揃える */
export const RUBY_WASM_VERSION = "2.10.1";
export const RUBY_WASM_URL = `https://cdn.jsdelivr.net/npm/@ruby/3.4-wasm-wasi@${RUBY_WASM_VERSION}/dist/ruby+stdlib.wasm`;
export const RUBY_WASI_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@${RUBY_WASM_VERSION}/dist/browser.umd.js`;

/** JavaScript の文字列を、そのまま Ruby の文字列リテラルとして埋め込めるようにする */
function rubyString(s: string) {
  // JSON の文字列は Ruby のダブルクォート文字列としても読める。式展開（#{}）だけ止める
  return JSON.stringify(s).replace(/#/g, "\\u0023");
}

// テストの中で使える expect は RSpec に近い書き方にする（中級以降の RSpec に慣れるため）
//   expect(calc_tax(1000)).to eq(100)
//   expect(names).to include("りんご")
//   expect { charge(-1) }.to raise_error(ArgumentError)
//   expect(logs).to eq(["550", "0"])   # logs は puts / p などの出力（1行ずつ）
const PRELUDE = String.raw`
require "json"
require "stringio"

class SakuraMartTestFailure < StandardError; end

class SakuraMartMatcher
  attr_reader :description
  def initialize(description, &block)
    @description = description
    @block = block
  end
  def matches?(actual) = @block.call(actual)
end

class SakuraMartExpectation
  def initialize(actual, block)
    @actual = actual
    @block = block
  end

  def to(matcher)
    if matcher.description == :raise_error
      return matcher.matches?(@block)
    end
    return if matcher.matches?(@actual)
    raise SakuraMartTestFailure, "期待した値: #{matcher.description}\n実際の値: #{@actual.inspect}"
  end

  def not_to(matcher)
    return unless matcher.matches?(@actual)
    raise SakuraMartTestFailure, "期待した値: #{matcher.description} ではない値\n実際の値: #{@actual.inspect}"
  end
end

def expect(actual = nil, &block) = SakuraMartExpectation.new(actual, block)
def eq(expected) = SakuraMartMatcher.new(expected.inspect) { |a| a == expected }
def be(expected) = SakuraMartMatcher.new(expected.inspect) { |a| a.equal?(expected) }
def be_truthy = SakuraMartMatcher.new("真になる値") { |a| a }
def be_falsey = SakuraMartMatcher.new("偽になる値（false か nil）") { |a| !a }
def be_nil = SakuraMartMatcher.new("nil") { |a| a.nil? }
def be_a(klass) = SakuraMartMatcher.new("#{klass} のインスタンス") { |a| a.is_a?(klass) }
def __sakura_mart_include(items)
  SakuraMartMatcher.new("#{items.map(&:inspect).join(", ")} を含む値") do |a|
    a.respond_to?(:include?) && items.all? { |i| a.include?(i) }
  end
end
def raise_error(klass = StandardError)
  SakuraMartMatcher.new(:raise_error) do |block|
    raise SakuraMartTestFailure, "expect { ... } の形で、ブロックを渡してください" unless block
    begin
      block.call
    rescue klass
      next true
    rescue SakuraMartTestFailure
      raise
    rescue Exception => e
      raise SakuraMartTestFailure, "#{klass} が発生することを期待しましたが、#{e.class} が発生しました"
    end
    raise SakuraMartTestFailure, "#{klass} が発生することを期待しましたが、発生しませんでした"
  end
end

# テストの中で、受講者のコードを実行したときの出力を参照する
def logs = $__sakura_mart_logs.dup

def __sakura_mart_describe_error(e)
  frame = (e.backtrace_locations || []).find { |l| l.path == "main.rb" }
  line = frame&.lineno || e.message[/main\.rb:(\d+)/, 1]
  message = e.message.gsub(/main\.rb:\d+:\s*/, "").strip
  where = line ? "（#{line}行目）" : ""
  # 構文エラーは2行目以降にコードの抜粋が付くので、行番号は1行目の最後に付ける
  first, rest = message.split("\n", 2)
  ["#{e.class}: #{first}#{where}", rest].compact.join("\n")
end

def __sakura_mart_run(code, tests)
  out = StringIO.new
  err = StringIO.new
  original_stdout, original_stderr = $stdout, $stderr
  $stdout, $stderr = out, err
  error = nil
  begin
    TOPLEVEL_BINDING.eval(code, "main.rb", 1)
  rescue Exception => e
    error = __sakura_mart_describe_error(e)
  end

  logs = out.string.lines(chomp: true) + err.string.lines(chomp: true).map { |l| "[警告] #{l}" }
  $__sakura_mart_logs = logs
  results = []
  unless error
    # トップレベルの include（モジュールを取り込む）を、テストの中だけマッチャーに置き換える
    TOPLEVEL_BINDING.receiver.define_singleton_method(:include) { |*items| __sakura_mart_include(items) }
    tests.each do |name, test_code|
      TOPLEVEL_BINDING.eval(test_code, "test.rb", 1)
      results << { name: name, passed: true }
    rescue SakuraMartTestFailure => e
      results << { name: name, passed: false, message: e.message }
    rescue Exception => e
      results << { name: name, passed: false, message: "#{e.class}: #{e.message.gsub(/(main|test)\.rb:\d+:\s*/, "")}" }
    end
  end
  JSON.generate({ logs: logs, error: error, tests: results })
ensure
  $stdout, $stderr = original_stdout, original_stderr
end
`;

/** 受講者のコードとテストを実行し、結果を JSON 文字列で返す Ruby のプログラムを組み立てる */
export function buildRubyProgram(code: string, tests: { name: string; code: string }[] = []) {
  const testList = tests.map((t) => `[${rubyString(t.name)}, ${rubyString(t.code)}]`).join(", ");
  return `${PRELUDE}\n__sakura_mart_run(${rubyString(code)}, [${testList}])`;
}

export function parseRubyResult(json: string): RunResult {
  const r = JSON.parse(json) as { logs: string[]; error: string | null; tests: RunResult["tests"] };
  return {
    logs: r.logs,
    ...(r.error ? { error: r.error } : {}),
    tests: r.tests.map((t) => (t.message ? t : { name: t.name, passed: t.passed })),
  };
}
