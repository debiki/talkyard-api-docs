
// Talkyard "API docs", consisting of Typescript types and
// pseudocode HTTP requests and responses.
//

// There's these endpoints: (details follow)
//
// /-/v0/get
// /-/v0/list
// /-/v0/search
// /-/v0/query
// /-/v0/do

// Dependent types, nice, see:
// https://www.javiercasas.com/articles/typescript-dependent-types
// section "A first touch of Dependent Types in Typescript".
// — Ty uses this to create an easy to remember, and type safe API,
// even works with VSCode's autocomplete.
//
// For example listQuery:s for different things: pages, posts, participants,
// have the same fields: { listWhat: ..., lookWhere: ..., ..., inclFields: ... }
// and thanks to the 'listWhat' type discriminator field,
// the other fields can be type safe, so if you specify e.g. a *page* field
// in inclFields, when asking for a *participant* — there'd be a compile time error.
//
// This is called Discriminated Unions or Tagged Unions:
// Only one type, of some specific types, can be in use at any one time,
// and a tag field (getWhat, listWhat, findWhat) decides which one is in use.
// https://en.wikipedia.org/wiki/Tagged_union



// Misc types
// -------------------------

interface ApiRequest {
  pretty?: Bo;
}

// An API request can include one or many things for the server to do — many tasks.
// For example, a SearchQueryApiRequest includes just a single SearchQueryApiTask,
// whilst a ManyQueriesApiRequest can include many SearchQueryApiTask:s.
interface ApiTask {}

type ApiResponse<R> = ApiErrorResponse | R;

interface ApiErrorResponse {
  error: ResponseError;
}

interface ResponseError extends Partial<ErrCodeMsg> {
  httpStatusCode?: Nr;
}

interface ErrCodeMsg {
  errCode: St;
  errMsg: St;
}


interface ManyResults {
  results: (OkResult | ErrorResult | ManyResults)[];
}


interface OkResult {
  ok: true;
}

interface ErrorResult {
  error: ErrCodeMsg;
}


type ParticipantId = string;

type MemberRef = string;
type GuestRef = string;
type PatRef = MemberRef | GuestRef;
type PageRef = string;
type PostRef = St;
type TypeRef = string;
type BadgeRef = string;

type PageSortOrder = 'PopularFirst' | 'ActiveFirst' | 'NewestFirst';
type PageTypeSt = 'Question' | 'Problem' | 'Idea' | 'Discussion';
type PageDoingStatusSt = null | 'Planned' | 'Doing' | 'Done';
type PageClosedStatusSt = null | 'Closed' | 'Locked' | 'Frozen';
type PageDeletedStatusSt = null | 'Deleted' | 'HardDeleted';

type EventSortOrder = 'NewestFirst' | 'OldestFirst';

type Unimplemented = undefined;



// What you're looking for
// -------------------------

// The different things Search Queries and List Queries can find:
// (Ty devs: Also see enum ThingType in client/types-and-const-enums.ts. [ty_things_types])

type FindWhat =
  // Info about  also be sent via webhoos (not yet impl)
  'Events' |

  'Pages' |

  'Posts' |

  // Users and groups (not guests).  (Shorthand for 'Pats' + is-member-not-guest filter?)
  'Members' |

  // Users, groups, guests.
  'Pats' |

  // Maybe you don't remember if you invited someone, and want to find
  // any invite with the relevant email address.
  'Invites' |

  // Maybe you wonder if a reply notification email got sent or not — maybe your
  // mail server was offline for a while.
  'EmailsSent' |

  // If you have many tags, and want to find a tag via its About text or title.
  'Tags' |

  // If you have many categories so you need to search & find.
  'Categories' |

  // If you want to find a user badge, by searching badge titles or about texts.
  'Badges';


type WhatThing =
  'Event' |
  'Page'  |
  'Post'  |
  'Pat'; // 'Pat' is short for "Participant"



interface Thing {
  // Not needed, if only one thing type allowed, e.g. a webhook request would
  // only include Event:s — then, no need for `what: 'Event'`.
  what?: WhatThing;

  // Can be left out, if looking up one specific thing, by id. Then the caller
  // already knows its id (e.g. in client/embedded-comments/comments-count.ts).
  id?: St | Nr;
}



// Where to search
// -------------------------

// In which text fields or content sections to look, when searching for things,
// or listing things.
//
interface LookWhere {
  // E.g for autocompleting a username, when @mentioning someone.
  usernames?: boolean;

  // Users, groups and guests can have full names.
  fullNames?: boolean;

  emailAddresses?: boolean;

  // Find members in these groups.
  // E.g.  { inGroups: ['username:some_group', 'patid:223344'] }   or 'groupid:...'  ?
  inGroups?: MemberRef[];

  // Find members with these badges.
  withBadges?: BadgeRef[];

  // About a user / group,  or category, or tag, or user badge.
  aboutText?: boolean;

  // Search page titles, or tag titles, or user badge titles, or email subject lines.
  titleText?: boolean;

  // Searches the page body (original post) only, not the title, not any replies.
  // Or an email body (not subject line).
  bodyText?: boolean;

  // Searches replies, but not page title or body (original post).
  repliesText?: boolean;

  // Searches everything: Page tite, body, and replies.
  pageText?: boolean;

  // If you want to search only, say, pages of type Article and Question.
  pageTypes?: PageType[];

  // List posts or participants in these pages.
  // E.g.  { inPages: 'pageid:112233' }  ?
  inPages?: PageRef[];

  // Find pages in these categories.
  // E.g.  { inCategories: 'catid:112233' }  ?
  inCategories?: CategoryRef[];

  // Pages with these tags.
  withTags?: TypeRef[];

  // Posts written by these users or groups.
  writtenBy?: MemberRef[];
};


// What you get back
// -------------------------

type ThingFound = PageOptFields
                | PageFound
                | PageListed  // hmm, incl in  PageOptFields  above
                | PostListed
            //  | Event
                | TyPat | TagFound | CategoryFound;



// Corresponds to  type WhatThing = 'Pat'.
interface TyPat extends Thing {
  what?: 'Pat';
  id: PatId;
  ssoId?: St;
  extId?: St;
  ppId: ParticipantId;  // deprecated
  username?: string;
  fullName?: string;
  tinyAvatarUrl?: string;
  isGroup?: boolean;
  isGuest?: boolean;
}

interface GuestFound extends TyPat {
  username?: undefined; // guests don't have real accounts
  fullName: string;  // they always have a name or alias though
  isGroup?: false;
  isGuest: true;
}

interface MemberFound extends TyPat {
  username: string;  // members always have usernames
  isGuest?: false;
}

interface UserFound extends MemberFound {
  isGroup?: false;
  // soId?: St;   later (sign-on id)
  // extId?: St;  later (external id)
}

interface GroupFound extends MemberFound {
  isGroup: true;
}


interface PageOptFields extends Thing {
  what?: 'Page';
  id?: PageId;

  // Deprecated:
  pageId?: PageId;

  //pageType: PageTypeSt; ... etc, see EventPageData
  title?: St;
  // Prefix with the origin (included in the response) to get the full URL.
  urlPath?: St;
  excerpt?: St;
  author?: TyPat;
  categoriesMainFirst?: CategoryFound[];
  numOpLikeVotes?: Nr;
  numTotRepliesVisible?: Nr;
}


// Rename to PageDef(ault)Fields ?
interface PageFoundOrListed extends PageOptFields {
  id: PageId;

  // Deprecated:
  pageId: PageId;

  title: string;
  // Prefix with the origin (included in the response) to get the full URL.
  urlPath: string;
  excerpt?: string;
  author?: TyPat;
  categoriesMainFirst?: CategoryFound[];
}

interface PageFound extends PageFoundOrListed {
  postsFound: PostFound[];
}

type PageListed = PageFoundOrListed;



// RENAME to just Post?
interface PostFoundOrListed extends Thing {
  what?: 'Post';
  isPageTitle?: boolean;
  isPageBody?: boolean;
  author?: TyPat;
}

interface PostFound extends PostFoundOrListed {
  // With <mark> tags and html escapes, like:
  //   ["When you want to <mark>climb</mark> a tall
  //    &amp; exciting <mark>tree</tree> then",
  //   ... ].
  htmlWithMarks: string[];
}

// RENAME to PostAlone?  (not wrapped in page)
interface PostListed extends PostFoundOrListed {
  id: number;
  nr: number;
  parentNr?: number;
  pageId: PageId;
  pageTitle: string;
  urlPath: string;
  author: UserFound,
  approvedHtmlSanitized?: string;
}

// Page id not needed, since is in a page {} obj.
// RENAME to PostInPage? ("Wrapped in" is a bit long?)
interface PostWrappedInPage extends PostFoundOrListed {
  id: Nr;
  nr: Nr;
  parentNr?: Nr;
  author?: UserFound,
  approvedHtmlSanitized: St;
}

type TagFound = Unimplemented;



interface TagAnyVal {
  tagType: TypeRef  // e.g. "rid:some-tag-type" (where 'rid' is short for "reference id")
  valType?: 'Int32' | 'Flt64' | 'StrKwd'
  valInt32?: Nr
  valFlt64?: Nr
  valStr?: St
}

// Just a normal content tag or user badge. It's title is given by the tag type's name.
interface TagNoVal extends TagAnyVal {
  valType?: U
  valInt32?: U
  valFlt64?: U
  valStr?: U
}

// [detailed_tag_val_types]:

// This tag has a value — a 32 bit integer.
interface TagInt32 extends TagAnyVal {
  valType: 'Int32'
  valInt32: Nr

  valFlt64?: U
  valStr?: U
}

interface TagFlt64 extends TagAnyVal {
  valType: 'Flt64'
  valFlt64: Nr

  valInt32?: U
  valStr?: U
}

// This tag has a value — a string, indexed as "type: keyword" in ElasticSearch.
interface TagStrKwd extends TagAnyVal {
  valType: 'StrKwd'
  valStr: St

  valInt32?: U
  valFlt64?: U
}


// Sync w TypeValueType.
type TypeValueTypeSt = 'Int32' | 'Flt64' | 'StrKwd';


interface CategoryFound {
  categoryId: CategoryId;
  name: string;
  urlPath: string;
};



type EventType =
    'PageCreated' | 
    'PageUpdated' | 
    'PostCreated' | 
    'PostUpdated' |
    'PatCreated'  |
    'PatUpdated';


// An event describes something that happened in Talkyard, e.g. a page was created,
// or comment posted.
// RENAME to TyEvent?
interface Event_ extends Thing {
  what?: 'Event';
  id: Nr;
  when: WhenMs,
  eventType: EventType;
  eventData: Object;
}

interface PageCreatedEvent extends Event_ {
  eventType: 'PageCreated';
  eventData: {
    page: EventPageData & { posts: PostWrappedInPage[] };
  }
}

interface PageUpdatedEvent extends Event_ {
  eventType: 'PageUpdated';
  eventData: {
    page: EventPageData;
  }
}

interface PostCreatedEvent extends Event_ {
  eventType: 'PostCreated';
  eventData: {
    post: PostListed;
  }
}

interface PostUpdatedEvent extends Event_ {
  eventType: 'PostUpdated';
  eventData: {
    post: PostListed;
  }
}

interface PatCreatedEvent extends Event_ {
  eventType: 'PatCreated';
  eventData: {
    pat: TyPat;
  }
}

interface PatUpdatedEvent extends Event_ {
  eventType: 'PatUpdated';
  eventData: {
    pat: TyPat;
  }
}


interface EventPageData {
  id: PageId;
  title: St;
  urlPath: St;
  pageType: PageTypeSt;
  answerPostId?: PostId;
  doingStatus?: PageDoingStatusSt;
  closedStatus?: PageClosedStatusSt;
  deletedStatus?: PageDeletedStatusSt;
  categoriesMainFirst: CategoryFound[];
}



// Include which fields?
// -------------------------

// When getting back things (pages, comments, users) from the server, then, which
// fields should the server include? Blog comments, for example, might need only
// Like counts, while an AI LLM integration wants lots of things (the orig post,
// best comments, any accepted answer, for example).

interface InclFields {
  // id & refId — maybe shared by almost everything?
}


interface InclEventFields extends InclFields {
  // ... later
}


// A  Get Query request
// -------------------------

// API endpoint complete URL path:  /-/v0/get
//
// When you know precisely what you want, you can use a Get Query, to look up
// directly by id / url / username / something. For each lookup key you specify,
// you'll get back exactly one thing, or null.
//
// But if you don't know the exact ids / something, e.g. you have a username
// *prefix* only, then you can use a List Query instead, to list all participants
// with matching usernames — now, you might get back 0, 1 or many matching things.
//
// Tech details: Looks up by database primary key. So you know you'll get 1 or 0.
// That's why the getWhat and ids (e.g. `getPages: [page-id-one, two, three]`)
// are one single same key-value. — Compare with ListQuery, which has two separate
// fields: listWhat: ... and lookWhere: .... E.g. listWhat: 'Posts' and
// lookWhere: category-ids, to find recent posts in those categories.
//

interface GetQueryApiRequest extends ApiRequest, GetQueryApiTask {
}


interface GetQueryApiTask extends ApiTask {
  getQuery: GetPagesQuery | GetPatsQuery;
}

interface GetQuery {
  getWhat: FindWhat;
  getRefs: Ref[];
  inclFields?: InclFields;
}


interface GetPagesQuery extends GetQuery {
  getWhat: 'Pages',
  getRefs: PageRef[];
  inclFields?: InclPageFields;
 }
 

// What page fields to include, when getting back a Page in an API response.
//
// Sometimes you're just looking for, say, the number of Like votes, to show on a
// blog post index page. Then it's unnecessary to include lots of other stuff.
//
// (This reminds a bit of GraphQL, in that the client chooses what should be included
// in the response. However, this maps more cleanly to how Talkyard works, rather
// than being super generic works-for-anything like GraphQL.)
//
interface InclPageFields extends InclFields {
    id?: Bo;
    refId?: Bo;

    // Only the orig post:
    //numOpRepliesVisible?: Bo;
    numOpLikeVotes?: Bo;
    numOpDoItVotes?: Bo;
    numOpDoNotVotes?: Bo;

    // Whole page:
    numTotRepliesVisible?: Bo;
    //numTotLikeVotesVisible?: Bo;

    // If the page title should be included in Page objects in the API response.
    title?: Bo;

    // If the Original Post should be included in Page objects in the API response.
    // Unimplemented!
    origPost?: Bo;  // unimpl
}


// For fetching participants, when you know their ids or usernames already.
// Not implemented.
interface GetPatsQuery extends GetQuery {   // not impl
  getWhat: 'Pats',
  getRefs: PatRef[];
  inclFields: InclPatFields;
}


interface InclPatFields extends InclFields {  // parser not impl (see InclFieldsParSer)
  id?: Bo;
  refId?: Bo;
  ssoId?: Bo;

  fullName?: Bo;
  username?: Bo;
  isGuest?: Bo;
}




type GetQueryApiResponse<T extends ThingFound> = ApiResponse<GetQueryResults<T>>;

// A Get query includes a list of ids or usernames or reference ids, and you get
// back a list of things in the same order, or null for things that were missing.
//
interface GetQueryResults<T extends ThingFound> {
  origin: St;

  // One item for each getRefs[] item, in the same order.
  thingsOrErrs: (T | ErrCodeMsg | null)[];
}

// Here's how it works. Pesudocode for sending a POST request to /-/v0/get with
// a json payload,
//
// Get blog post comment counts:

POST '/-/v0/get' {
  getQuery: {
    getWhat: 'Pages',
    getRefs: [
      'emgurl:https://blog/a-blog-post',
      'emgurl:https://blog/another',
      'emgurl:https://blog/a-third',
    ],
    inclFields: {
      numOpLikeVotes: true,
      numTotRepliesVisible: true,
    },
  }
}

// Sample response, assuming /a-blog-post (the first item in the 'getRefs' list)
// couldn't be found:
//
//   {
//     origin: "https://example.com",
//     thingsOrErrs: [
//       { error: { errCode: 'TyEPGNF', errMsg: ...,  } },
//       { numOpLikeVotes: 11, numTotRepliesVisible: 22 },
//       { numOpLikeVotes: 33, numTotRepliesVisible: 44 },
//     ],
//   }
//
// But if the request fails completely, then you'll get back e.g. status code 403 Forbidden
// (and NNN below is then 403), and you'll get no results back:
//
// {
//   error: {
//     httpStatusCode: NNN,
//     errCode: "TyEMMMMMM",
//     errMsg: "...",
//   }
// }
//
//
// Or, to fetch whole pages: (or the orig post + top comments, if too many comments)

POST '/-/v0/get' {
  getQuery: {
    getWhat: 'Pages',
    getRefs: [
      'pageid:111',
      'pageid:222',
      'refid:something',
    ],
    inclFields: {
      title: true,
      numOpLikeVotes: true,
      numTotRepliesVisible: true,
      posts: true,   // later, maybe sth like:
                     //   { origPost: true, numTopComments: 20 }
                     // — see  InclPosts  in  InclFields.scala.
    },
  }
}





// A  List Query request
// -------------------------

// Endpoint:  /-/v0/list

// To fetch a list of things, e.g. the most recent comments on a blog.
// Or the most recent new pages in a forum, or newest users. Or oldest.
//
// List Queries are comparatively fast — they lookup things directly, via indexes in
// the PostgreSQL database.  However they cannot do full text search — for that,
// you need a Search Query.
//
// Tech details: Looks up by database index, often not the primary key.
// The index might be on table B, although you're finding things in table A.
// E.g. you might list the most recent topics in a category.
//
interface ListQueryApiRequest extends ApiRequest, ListQueryApiTask {
}

interface ListQueryApiTask extends ApiTask {
  listQuery: ListQuery;
  limit?: Nr;
}

interface ContinueListQueryApiRequest extends ApiRequest {
  continueAtScrollCursor?: ListResultsScrollCursor;
  limit?: Nr;
}

interface ListQuery {
  // Query type discriminator.
  listWhat: FindWhat;
  inclFields?: InclFields;

  // E.g. username prefix.
  exactPrefix?: St;

  // Maybe you want to list members in a specific user group, or pages in a specific category.
  lookWhere?: LookWhere;

  filter?: QueryFilter;
  sortOrder?;
  limit?: Nr;
}


type QueryFilter = PageFilter;  // for now


interface ListPagesQuery extends ListQuery {
  listWhat: 'Pages';
  inclFields?: InclPageFields;
  lookWhere?: { inCategories: CategoryRef[] };
  filter?: PageFilter;
  sortOrder?: PageSortOrder;
}


interface PageFilter {
  isDeleted?: Bo;  // default: false
  isOpen?: Bo;
  isAuthorWaiting?: Bo;
  pageType?: { _in: PageTypeSt[] };
}


interface ListEventsQuery extends ListQuery {
  listWhat: 'Events';
  inclFields_unimpl?: InclEventFields;
  sortOrder?: EventSortOrder;
}


type ListQueryApiResponse<T extends ThingFound> = ApiResponse<ListQueryResults<T>>;

interface ListQueryResults<T extends ThingFound> {
  origin: string;
  thingsFound?: T[];
  scrollCursor?: ListResultsScrollCursor;
}

type ListResultsScrollCursor = Unimplemented;


// Examples:
//
// Auto-complete username "jane_doe" when typing a username prefix:

FOST '/-/v0/list'  {
  listQuery: {
    exactPrefix: 'jane_d',
    listWhat: 'Members',
    lookWhere: { usernames: true },

    // Later:
    // inclFields: { fullName: true, username: true }
  }
}


// Example:
//
// Listing users, to show in an autocomplete f.ex.:

POST '/-/v0/list' {
  listQuery: {
    listWhat: 'Pats'
    exactPrefix: 'jane_d',   // can use db index
    lookWhere: { usernames: true },
    inclFields: {
      fullName: true,
      username: true,
    }
  }
}


// List popular pages in a category:

POST '/-/v0/list' {
  listQuery: {
    listWhat: 'Pages',
    lookWhere: { inCategories: [categoryA, catB, catC] },
    filter: {
      isOpen: true,
    },
    sortOrder: 'PopularFirst',
    limit: 5,
  }
}

// Response ex:
//
// (The origin is included, so if there're image links with '/relative/paths', or links
// to user profile pages, we'll know what origin to insert before the url path.)
//
{ origin: "https://example.com", thingsFound: [...]  }


// List recent webhook events:

// cURL example:
//
curl --user tyid=2:14xubgffn4w1b3iluvd2uyntzm -X POST -H 'Content-Type: application/json' http://e2e-test-cid-0-0-now-6795.localhost/-/v0/list -d '{ "listQuery": { "listWhat": "Events" }}'

// Pseudocode:
POST '/-/v0/list' {
  listQuery: {
    listWhat: 'Events',
    sortOrder: 'NewestFirst',
  }
}

// Response ex:

{
  origin: "https://talkyard.example.com",
  thingsFound: [{
    what: 'Event',
    id: 1234,  // event id
    type: 'PageCreated',
    data: {
      page: {   // JsPageFound
        id:
        title:
        urlPath:
        categoriesMainFirst: 
        author: {
          JsParticipantFoundOrNull
        },
        postsByNr: {
          '1': {
            body: "Orig post text",
            bodyFormat: "CommonMark",
          }
        }]
      },
    }
  }, {
    what: 'Event',
    id: 567,
    ...
  }]
}



// A  Search Query request
// -------------------------

// Finds things via the full text search / faceted serarch database —
// that is, ElasticSearch (currently), not PostgreSQL.
//

interface SearchQueryApiRequest extends ApiRequest, SearchQueryApiTask {
}

interface SearchQueryApiTask extends ApiTask {
  searchQuery: SearchQuery_;
  limit?: number;
}

interface ContinueSearchQueryApiRequest extends ApiRequest {
  continueAtScrollCursor?: SearchResultsScrollCursor;
  limit?: Nr;
}


type SearchQuery_ = SinglSearchQuery | CompoundSearchQuery;

// Not implemented.
type CompoundSearchQuery =
  // 'And' match — all must match.
  // (For 'or' match, instead, send many SearchQueryRequest:s.)
  SinglSearchQuery[];


interface SinglSearchQuery {
  // "Freetext" refers to free-form text, meaning, unstructured text:
  // The user can type anything. And the server interprets the meaning as best
  // it can, maybe interprets "buy ice skating shoes" as "buy ice skates".
  freetext?: string;

  findWhat?: FindWhat,
  lookWhere?: LookWhere;
};


type SearchQueryApiResponse<T extends ThingFound> = ApiResponse<SearchQueryResults<T>>;

interface SearchQueryResults<T extends ThingFound> {
  origin: string;
  thingsFound?: T[];
  scrollCursor?: SearchResultsScrollCursor;
}

type SearchResultsScrollCursor = Unimplemented;


// Examples:
//
POST '/-/v0/search' {
  searchQuery: { freetext: "how climb a tree" }
}

// The above is the same as:

POST '/-/v0/search' {
  searchQuery: {
    freetext: 'how climb a tree',
    findWhat: 'Pages',             // the default
    lookWhere: { pageText: true }. // the default, when finding pages
  }
}

// Response ex:

   { origin: "https://example.com", thingsFound: [...]  }


// Find a user: (participant)

POST '/-/v0/search' {
  searchQuery: {
    freetext: 'jane',
    findWhat: 'Pats',
    lookWhere: { usernames: true, fullNames: true }
  }
}



// A Query API request
// -------------------------
//
// Lets you send many queries in a single http request, and optionally all of them
// in the same transaction.
//
POST '/-/v0/query'  {
  runQueries: [{
    getQuery: {
      getWhat: 'Pages',
      getRefs: [
        'emburl:https://blog/a-blog-post':
        'emburl:https://blog/another',
        'emburl:https://blog/a-third',
      ],
      inclFields: {
        numRepliesVisible: true,
        numOrigPostLikeVotes: true,
      },
    }
  }, {
    listQuery: {
      listWhat: 'Members',
      exactPrefix: 'jane_d',
      lookWhere: { usernames: true },
    }
  }, {
    listQuery: {
      listWhat: 'Pages',
      lookWhere: { inCategories: [catB, catC] },
    }
  }, {
    searchQuery: {
      ...
    }
  }]
}

interface QueryApiRequest extends ApiRequest, ManyQueriesApiTask {
}

interface ManyQueriesApiTask extends ApiTask {
  runQueries: QueryApiTask[];
}

type QueryApiTask = GetQueryApiTask | ListQueryApiTask | SearchQueryApiTask;




// A Do API request   [ACTNPATCH]   [use_the_Do_API]
// -------------------------
//
// Endpoint:  /-/v0/do
//

interface DoApiRequest extends ApiRequest, DoActionsApiTask {
}

interface DoActionsApiTask extends ApiTask {
  doActions: Action[];
}

type DoActionsApiResponse = ApiResponse<ManyResults>;


interface Action {
  asWho: St; // 'sysbot' | 'tyid:_' | 'extid:_' no 'rid:_' | 'ssoid:_' | 'username:_';
  doWhat: ActionType,
  doWhy?: St; // optional description for the audit log
  doHow: Object;  // per action type parameters
}

type ActionType =
  'UpsertType' |
  'CreatePage' |
  'CreateComment' |
  // 'CreateMetaComment' |
  'DeletePosts' |
  'SetVote' |
  'SetNotfLevel';


interface UpsertTypeAction extends Action {
  doWhat: 'UpsertType';
  doHow: UpsertTypeParams;
}

interface UpsertTypeParams {
  refId?: RefId;
  kindOfType: 'TagType';
  dispName: St;
  urlSlug?: St;
  // wantsValue?: NeverAlways; — maybe later
  valueType?: TypeValueTypeSt;
}

interface SetVoteAction extends Action {
  doWhat: 'SetVote';
  doHow: SetVoteParams;
}

interface SetVoteParams {
  voteType: 'Like';
  howMany: 0 | 1; // 0 clears any votes (by the same person)
  // Either:
  whatPage?: PageRef;
  postNr?: PostNr; // defaults to the page (the orig post)
  // Or:
  whatPost?: PostRef;  // but skip?:  | { pageId: St, postNr: 1 } | { postId: _ }
}

interface SetNotfLevelAction extends Action {
  doWhat: 'SetNotfLevel';
  doHow: {
    toLevel: Nr;
    whatPages: ({ pageId: St } | { inCategoryId: CatId })[];
  }
}

interface CreatePageAction extends Action {
  doWhat: 'CreatePage';
  doHow: CreatePageParams;
}

interface CreatePageParams extends CreatePostParams {
  title: St;
  pageType: PageTypeSt;
  inCategory: CatRef;
}


interface CreateCommentAction extends Action {
  doWhat: 'CreateComment';
  doHow: CreateCommentParams;
}

interface CreateCommentParams extends CreatePostParams {
  parentNr?: PostNr;
  whatPage: PageRef;
  // replyTo: { pageId: PageId, postNr?: PostNr } | { postId: PostId };
}


interface CreatePostParams {
  refId?: Ref;
  bodySrc: St;
  bodyFmt: 'CommonMark';
  withTags?: TagAnyVal[]
}


/* No, use a different comment type instead?
interface CreateMetaPostAction extends Action {
  doWhat: 'CreateMetaComment';
  doHow: {
    appendTo: { pageId: PageId };
    bodySrc: St;
    bodyFmt: 'CommonMark';
  }
} */


interface DeletePostsAction extends Action {
  doWhat: 'DeletePosts';
  doHow: DeletePostsParams;
}

interface DeletePostsParams {
  whatPost?: PostRef;
  postsCreatedBy?: PatRef;
  postsCreatedAfter?: WhenMs;
}



// Example Do API request:
//
POST '/-/v0/do' {
  doActions: [{
    asWho: 'sysbot' | 'tyid:_' | 'extid:_' no 'rid:_' | 'ssoid:_' | 'username:_',
    doWhat: 'SetVote'
    doHow: {
      voteType: 'Like',
      whatPost: { postId: _ } | { pageId: _, postNr: 1 },
      howMany: 1 | 0,
      // Future compat w assigning many Do-It votes
      // per person to a single feature request.
    },
  }, {
    asWho: _
    doWhat: 'SetNotfLevel',
    doHow: {
      whatLevel: 'EveryPost',
      whatPage: { pageId: _ },
    }
  }, {
    asWho: 'ssoid:some-user-id',
    doWhat: 'CreateComment',
    doHow: {
      bodySrc: _,
      bodyFmt: 'CommonMark',
      whatPage: 'rid:page-reference-id',
      parentNr: 123,
      withTags?: [{ tagType: 'rid:tag-type' }, ...],
    }
  }, {
    asWho: _
    doWhat: 'CreatePage',
    doHow: {
      pageType: 'Discussion',   # PageTypeSt
      title: _,
      bodySrc: _,
      bodyFmt: 'CommonMark',
      inCategory: CatRef,
      withTags?: [{ tagType: 'rid:pubyear', valType: 'Int32', valInt32: 1990 }, ...],
    }
  }, {
    asWho: 'sysbot',
    doWhat: 'CreateUser',
    doHow: {
      username: _,
      fullName: _,
      primaryEmailAddr?: St;
      primaryEmailAddrVerified?: Bo;
      addToGroups: _  // or  doWhat: 'AddUserToGroup'  below, instead?
    }
  }, {
    asWho: 'sysbot',
    doWhat: 'AddUserToGroup',
    doHow: {
      whichUser: _,  // reference user above
      whichGroup: _,
    }
  }, {
    asWho: 'sysbot',
    doWhat: 'MovePages',
    doHow: {
      whichPages: _,
      toCategory: _,
  }, {
    // Nested — e.g. to run in single transaction. Not implemented (maybe never).
    inSingleTransaction: true;
    doActions: [{ ... }, { ... }, { ... }],
  }],
}


// Response is ManyResults:

{
  results: [{
    ok: true,   // if 'SetVote' went fine
  }, {
    error: {    // if 'SetNotfLevel' went fine
      errCode: _,
      errMsg: _,
    }
  }, {
    ok: true,    // if 'CreateComment' went fine
    postNr: 123,
    pageId: 12345,
    urlPath: 'https://server/-12345/page-slug#post-123,
  }, {
    ok: true,    // if 'CreatePage' went fine
    pageId: 12345,
    urlPath: 'https://server/-12345/page-slug,
  }, {
  ...
  }, {
    ok: true,   // user created
    urlPath: 'https://server/-/users/username',
  }, {
    ok: true,   // user added to group
  }, {
    results: [{ ... }, { ... }, { ... }]  // nested doActions results
  }],
}

