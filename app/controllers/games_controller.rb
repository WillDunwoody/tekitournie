class GamesController < ApplicationController
  # skip_authorization only: [:game_test]

  def waiting_room
    @game = Game.where("player_two_id = 1")
    if @game.exists?
      # GameChannel.broadcast_to(
      #   @game,
      #   "HHHEEEELLLOOOO"
      # )
      redirect_to game_path(@game[0].id)
    else
      user = current_user
      redirect_to new_user_game_path(user)
    end
    skip_authorization
  end

  def new
    @game = Game.new
    authorize @game
  end

  def create
    @game = Game.new(game_params)
    authorize @game
    @game.player_one_id = 1
    @game.player_two_id = 1
    @game.save!
    add_rounds_and_challenges(@game.id)
  end

  def add_rounds_and_challenges(id)
    game = Game.find(id)
    rounds = game.round_count
    all_challenges = Challenge.all.to_a

    while rounds.positive?
      challenge = all_challenges[rand(0..all_challenges.size - 1)]
      GameRound.create!(game_id: game.id, challenge_id: challenge.id, winner: current_user)
      all_challenges.delete_at(all_challenges.index(challenge))
      rounds -= 1
    end

    redirect_to game_path(game)
  end

  def show
    @game = Game.find(params[:id])
    GameChannel.broadcast_to(
      @game,
      "update page"
    )
    authorize @game
  end

  def edit
    @game = Game.find(params[:id])
    authorize @game
  end

  def update
    @game = Game.find(params[:id])
    authorize @game
    @game.update(game_params)
    @game.save

    respond_to do |format|
      format.js #add this at the beginning to make sure the form is populated.
    end
  end

  def game_test
    # lots of dangerous eval, look into ruby taints for possible safer alternative
    @game = Game.find(params[:id])
    begin
      submission = eval(params[:player_one_code])
    rescue SyntaxError => err
      @output = "ERROR: #{err.inspect}"
      @output.gsub!(/(#|<|>)/, "")
    # tests variable needs modifying to return not just first test but sequentially after round is won
    # below method also needs to consider if the method has 0, 1 or more parameters
    else
      tests = eval(@game.game_rounds.first.challenge.tests)
      @output = []

      tests.each do |k, v|
        begin
          call = method(submission).call(k)
        rescue StandardError => err
          @output << "ERROR: #{err.message}\n\n"
        rescue ScriptError => err
          @output << "ERROR: #{err.message}\n\n"
        else
          if call == v
            @output << "Test passed.\nWhen given #{k}, method successfully returned #{v}.\n\n"
          else
            @output << "Test failed.\n Given: #{k}. Expected: #{v}. Got: #{
              if call.nil?
                "nil"
              elsif call.class == String
                "'#{call}'"
              elsif call.class == Symbol
                ":#{call}"
              else
                call
              end
            }.\n\n"
          end
        end
      end
      @output = @output.join
    end
    @output.gsub!(/for #<\w+:\w+>\s+\w+\s+\^+/, "")

    respond_to do |format|
      format.js #add this at the beginning to make sure the form is populated.
      format.json { render json: @output.to_json }
    end

    skip_authorization
  end

  # not sure if this is needed 
  def update_display
    respond_to do |format|
      format.js #add this at the beginning to make sure the form is populated.
      format.json { render json: params[:player_one_code].to_json }
    end

    skip_authorization
  end

  def user_code
    @game = Game.find(params[:id])
    respond_to do |format|
      format.js #add this at the beginning to make sure the form is populated.
      format.json { render json: @game.player_one_code.to_json }
    end

    skip_authorization
  end

  private

  def game_params
    params.require(:game).permit(:player_one_id, :player_two_id, :player_one_code, :round_count)
  end
end
