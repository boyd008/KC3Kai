(function () {
  'use strict';

  KC3StrategyTabs.logger = new KC3StrategyTab('logger');

  KC3StrategyTabs.logger.definition = {
    ITEMS_PER_PAGE: 20,
    VISIBLE_PAGES: 9,

    filterState: {
      logTypes: {
        log: true,
        info: true,
        warn: true,
        error: true,
      },
      contexts: {
        'Background': true,
        'Strategy Room': true,
        'Devtools': true,
        'Content Script': true,
      },
    },

    filterFuncs: {
      logTypes({ type }) {
        const { logTypes: isVisible } = KC3StrategyTabs.logger.definition.filterState;
        return isVisible[type];
      },
      contexts({ context }) {
        const { contexts: isVisible } = KC3StrategyTabs.logger.definition.filterState;
        return isVisible[context];
      },
    },


    /* INIT: mandatory
    Prepares initial static data needed.
    ---------------------------------*/
    init() {},

    /* EXECUTE: mandatory
    Places data onto the interface from scratch.
    ---------------------------------*/
    execute() {
      const { initStackToggle, initLogClearButton, initFilter, initPagination, logError } =
        KC3StrategyTabs.logger.definition;
      return Promise.resolve()
        .then(initStackToggle)
        .then(initLogClearButton)
        .then(initFilter.bind(null, 'logTypes'))
        .then(initFilter.bind(null, 'contexts'))
        .then(initPagination)
        .catch(logError);
    },

    // --------------------------------------------------------------------- //
    // ------------------------[ INTERNAL METHODS ]------------------------- //
    // --------------------------------------------------------------------- //

    // -----------------------[ TOGGLE STACK TRACE ]------------------------ //

    initStackToggle() {
      $('.log_list').on('click', '.log_entry .summary', ({ currentTarget }) => {
        if($(currentTarget).hasClass('hover')) {
          $(currentTarget).parent().children('.data').slideToggle(50);
          $(currentTarget).parent().children('.stack').slideToggle(50);
        }
      });
    },

    // ------------------------[ CLEAR LOGS BUTTON ]------------------------ //

    initLogClearButton() {
      const { clearLogs, initPagination } = KC3StrategyTabs.logger.definition;
      $('.clear_logs').on('click', () => {
        clearLogs().then(initPagination);
      });
    },

    // ------------------------[ FILTER RENDERING ]------------------------- //

    initFilter(filterType) {
      const { renderFilter, initFilterStateListener, filterState } =
        KC3StrategyTabs.logger.definition;
      Object.keys(filterState[filterType]).forEach((key) => {
        renderFilter({ filterType, filterLabel: key, isVisible: filterState[filterType][key] });
      });
      initFilterStateListener(filterType);
    },

    renderFilter({ filterType, filterLabel, isVisible }) {
      const filter = $('.tab_logger .factory .entry_filter').clone();

      filter.children('.filter_label').html(filterLabel);
      filter.children('input').attr('checked', isVisible).attr('name', filterLabel);

      $(`.tab_logger [data-filter-type="${filterType}"`).append(filter);
    },

    initFilterStateListener(filterType) {
      const { initPagination, filterState } = KC3StrategyTabs.logger.definition;
      $(`.tab_logger [data-filter-type="${filterType}"] .entry_filter input:checkbox`).change(function () {
        // update filter state
        filterState[filterType][this.name] = this.checked;

        // reload log list
        initPagination();
      });
    },

    // ---------------------------[ PAGINATION ]---------------------------- //

    initPagination() {
      const { getEntryCount, ITEMS_PER_PAGE, showPagination } = KC3StrategyTabs.logger.definition;
      return getEntryCount()
        .then((entryCount) => {
          const pageCount = Math.ceil(entryCount / ITEMS_PER_PAGE);
          return showPagination(pageCount > 0 ? pageCount : 1);
        });
    },

    showPagination(pageCount) {
      const { VISIBLE_PAGES, renderPage } = KC3StrategyTabs.logger.definition;
      const element = $('.tab_logger .pagination');
      element.twbsPagination('destroy');
      element.twbsPagination({
        totalPages: pageCount,
        visiblePages: VISIBLE_PAGES,
        onPageClick(event, page) { renderPage(page); },
      });
    },

    renderPage(pageNum) {
      const { clearEntries, getLogEntries, splitByDate, renderElement } =
        KC3StrategyTabs.logger.definition;
      return Promise.resolve()
        .then(getLogEntries.bind(null, pageNum))
        .then(splitByDate)
        .then((elements) => {
          clearEntries();
          elements.forEach(renderElement);
        });
    },

    // ----------------------------[ DATABASE ]----------------------------- //

    getEntryCount() {
      const { composeFilters } = KC3StrategyTabs.logger.definition;
      return KC3Database.count_log_entries(composeFilters());
    },

    getLogEntries(pageNumber) {
      const { ITEMS_PER_PAGE, composeFilters } = KC3StrategyTabs.logger.definition;
      return KC3Database.get_log_entries({
        pageNumber,
        itemsPerPage: ITEMS_PER_PAGE,
        filters: composeFilters(),
      });
    },

    clearLogs() {
      return KC3Database.delete_log_entries();
    },

    composeFilters() {
      const { filterFuncs } = KC3StrategyTabs.logger.definition;
      return Object.keys(filterFuncs).map(key => filterFuncs[key]);
    },

    // -------------------------[ SPLIT BY DATES ]-------------------------- //

    splitByDate(logEntries) {
      if (!logEntries || logEntries.length === 0) { return []; }
      const { isDateSplit, createDateSeparator } = KC3StrategyTabs.logger.definition;

      return logEntries.reduce((result, entry, index) => {
        if (index > 0 && isDateSplit(logEntries[index - 1], entry)) {
          result.push(createDateSeparator(entry));
        }

        result.push(entry);

        return result;
      }, [createDateSeparator(logEntries[0])]);
    },

    isDateSplit({ timestamp: t1 }, { timestamp: t2 }) {
      const d1 = new Date(t1);
      const d2 = new Date(t2);
      return d1.getDate() !== d2.getDate();
    },

    createDateSeparator({ timestamp }) {
      return {
        type: 'dateSeparator',
        timestamp,
      };
    },

    // --------------------------[ RENDERING ]------------------------------ //

    renderElement(element = {}) {
      const { elementFactory } = KC3StrategyTabs.logger.definition;
      const { type } = element;
      if (!elementFactory[type]) {
        throw new Error(`Bad log entry: ${JSON.stringify(element)}`);
      }
      elementFactory[type].create(element);
    },

    elementFactory: {
      error: {
        create(spec) {
          const { renderLogEntry, elementFactory } = KC3StrategyTabs.logger.definition;
          const { formatStack } = elementFactory;
          const { stack, data } = spec;
          renderLogEntry($.extend(spec, { stack: formatStack(stack) }));
        },
      },
      warn: {
        create(spec) {
          const { renderLogEntry, elementFactory } = KC3StrategyTabs.logger.definition;
          const { formatStack } = elementFactory;
          const { stack, data } = spec;
          renderLogEntry($.extend(spec, { stack: formatStack(stack) }));
        },
      },
      log: {
        create(spec) {
          const { renderLogEntry } = KC3StrategyTabs.logger.definition;
          renderLogEntry(spec);
        },
      },
      info: {
        create(spec) {
          const { renderLogEntry } = KC3StrategyTabs.logger.definition;
          renderLogEntry(spec);
        },
      },
      // Remove the chrome-extension prefix from the stack trace to save space
      formatStack(stack) {
        return (stack || '')
          .replace(/chrome-extension:\/\/[^/]+\//g, 'src/');
      },
      dateSeparator: {
        create({ timestamp }) {
          const { createEntry, defineEntryProps } = KC3StrategyTabs.logger.definition;
          const entry = createEntry('date_separator');
          defineEntryProps(entry, { date: new Date(timestamp).format('isoDate') });
        },
      },
    },

    renderLogEntry({ type, timestamp, message, data, source, context, stack }) {
      const { formatTimestamp, createEntry, setEntryBackground, defineEntryProps,
        defineEntryDataArray, defineEntryStack } = KC3StrategyTabs.logger.definition;

      const entry = createEntry('log_entry');
      setEntryBackground(entry, type);
      defineEntryProps(entry, {
        timestamp: new Date(timestamp).format('isoTime'),
        message,
        dataline: data.join(' ').substr(0, 72),
        source,
        context
      });
      defineEntryDataArray(entry, data);
      defineEntryStack(entry, stack);
    },

    createEntry(classId) {
      const result = $(`.tab_logger .factory .${classId}`).clone();
      $('.tab_logger .log_list').append(result);
      return result;
    },

    setEntryBackground(entry, logLevel) {
      switch (logLevel) {
        case 'error':
          entry.addClass('bg-danger');
          break;
        case 'warn':
          entry.addClass('bg-warning');
          break;
        case 'log':
          entry.addClass('bg-success');
          break;
        case 'info':
          entry.addClass('bg-info');
          break;
        default:
          /* do nothing */
      }
    },

    defineEntryProps(entry, props) {
      const shortenSource = (
        s => s.substring(s.lastIndexOf('/') + 1, ((s.lastIndexOf(':') + 1) || (s.length + 1)) - 1)
      );
      Object.keys(props).forEach((key) => {
        if (key === 'source') {
          const sourceFull = props[key] || '';
          const sourceShort = shortenSource(sourceFull);
          $(`.${key}`, entry).text(sourceShort || 'n/a')
            .attr('title', sourceFull);
        } else {
          $(`.${key}`, entry).text(props[key]);
        }
      });
    },

    defineEntryDataArray(entry, data) {
      const dataAnchor = $('.data', entry);
      data.forEach((d, index) => {
        if (index !== 0) {
          dataAnchor.append('<hr />');
        }
        $(document.createElement('div')).text(d).appendTo(dataAnchor);
      });
      $('.summary', dataAnchor.parent()).toggleClass('hover', data.length > 0);
    },

    defineEntryStack(entry, stack) {
      const stackAnchor = $('.stack', entry);
      if (stack) {
        $(document.createElement('div')).text(stack).appendTo(stackAnchor);
        $('.summary', stackAnchor.parent()).addClass('hover');
     }
    },

    clearEntries() {
      $('.tab_logger .log_list').empty();
    },

    logError(error) {
      console.error(error, error.stack); /* RemoveLogging: skip */
    },
  };
}());

