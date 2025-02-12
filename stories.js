'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  console.debug('generateStoryMarkup', story);

  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);
  // Check if the current user is the one who posted the story
  const isUserStory = currentUser && story.username === currentUser.username;

  return $(`
    <li id="${story.storyId}">
    ${showStar ? getStarHTML(story, currentUser) : ''}
      <a href="${story.url}" target="a_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
      ${
        isUserStory ? '<button class="delete-button">Remove</button>' : ''
      } <!-- Conditionally render the delete button -->
    </li>
  `);
}

async function toggleStoryFavorite(evt) {
  console.debug('toggleStoryFavorite');

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest('li');
  const storyId = $closestLi.attr('id');
  const story = storyList.stories.find((s) => s.storyId === storyId);

  // see if the item is already favorited (checking by presence of star)
  if ($tgt.hasClass('fas')) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest('i').toggleClass('fas far');
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $tgt.closest('i').toggleClass('fas far');
  }
}
$storiesLists.on('click', '.star', toggleStoryFavorite);

function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? 'fas' : 'far';
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

async function removeStory(evt) {
  console.debug('removeStory');

  const $closestLi = $(evt.target).closest('li');
  const storyId = $closestLi.attr('id');

  await storyList.removeStory(currentUser, storyId);

  // re-generate story list
  await putUserStoriesOnPage();
}

$allStoriesList.on('click', '.delete-button', removeStory);
$ownStories.on('click', '.delete-button', removeStory);

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug('putStoriesOnPage');

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function createStory(evt) {
  console.debug('createStory', evt);
  evt.preventDefault();

  const title = $('#create-title').val();
  const author = $('#create-author').val();
  const url = $('#create-url').val();

  const storyData = {
    title,
    author,
    url,
  };
  console.log(storyData);
  const story = await storyList.addStory(currentUser, storyData);
  console.log(story);
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // hide the form and reset it
  $submitForm.slideUp('slow');
  $submitForm.trigger('reset');
}

$submitForm.on('submit', createStory);

function putUserStoriesOnPage() {
  console.debug('putUserStoriesOnPage');

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append('<h5>No stories added yet!</h5>');
  } else {
    // loop through all of users stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

/** Put favorites list on page. */

function putFavoritesListOnPage() {
  console.debug('putFavoritesListOnPage');

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append('<h5>No favorites added!</h5>');
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}
